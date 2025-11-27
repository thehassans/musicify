import os
import librosa
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

app = FastAPI(title="Musicify Python Analyzer", version="0.1.0")

class AnalyzeRequest(BaseModel):
    filePath: str
    metadata: Optional[Dict[str, Any]] = None

# Standard guitar tuning frequencies for E2 to E4 (approximate range for simple chords)
# This is a simplified lookup for basic major/minor chords
CHORD_TEMPLATES = {
    'C': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    'C#': [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    'D': [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    'D#': [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    'E': [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    'F': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    'F#': [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    'G': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    'G#': [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    'A': [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    'A#': [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    'B': [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
    'Cm': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    'C#m': [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    'Dm': [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    'D#m': [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
    'Em': [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
    'Fm': [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    'F#m': [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    'Gm': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    'G#m': [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
    'Am': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    'A#m': [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    'Bm': [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
}

PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

def estimate_chord(chroma_vector):
    """Identify the chord from a chroma vector using template matching."""
    max_score = -1
    best_chord = "N.C."
    
    # Normalize chroma vector
    chroma_vector = chroma_vector / (np.linalg.norm(chroma_vector) + 1e-6)
    
    for chord_name, template in CHORD_TEMPLATES.items():
        template = np.array(template)
        template = template / np.linalg.norm(template)
        score = np.dot(chroma_vector, template)
        
        if score > max_score:
            max_score = score
            best_chord = chord_name
            
    return best_chord

@app.post("/analyze")
async def analyze(req: AnalyzeRequest) -> Dict[str, Any]:
    if not os.path.exists(req.filePath):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        # Load audio
        y, sr = librosa.load(req.filePath)
        
        # Extract Chroma Features (Harmonic content)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        
        # Frame times
        frames = chroma.shape[1]
        frame_times = librosa.frames_to_time(np.arange(frames), sr=sr)
        
        # Detect chords per frame (simplified)
        # We'll group them into segments to avoid jitter
        detected_chords = []
        segment_length = 0.5 # seconds
        
        current_chord = None
        start_time = 0.0
        
        # Process in chunks
        chunk_size = int(librosa.time_to_frames(segment_length, sr=sr))
        
        for i in range(0, frames, chunk_size):
            chunk = chroma[:, i:i+chunk_size]
            if chunk.shape[1] == 0:
                continue
                
            # Average chroma over the chunk
            avg_chroma = np.mean(chunk, axis=1)
            chord = estimate_chord(avg_chroma)
            
            time = frame_times[i]
            
            if chord != current_chord:
                if current_chord is not None:
                    detected_chords.append({
                        "time": float(start_time),
                        "duration": float(time - start_time),
                        "chord": current_chord,
                        "section": "Detected" # Simplified sectioning
                    })
                current_chord = chord
                start_time = time
        
        # Add last chord
        if current_chord is not None:
             detected_chords.append({
                "time": float(start_time),
                "duration": float(frame_times[-1] - start_time),
                "chord": current_chord,
                "section": "Detected"
            })

        # Generate a summary
        key = "Unknown" # Could use librosa to estimate key
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        summary = f"Analyzed with Librosa. Estimated Tempo: {int(tempo)} BPM. " \
                  f"Detected {len(detected_chords)} chord changes."

        return {
            "summary": summary,
            "chords": detected_chords,
            "tabs": {
                "tuning": "E A D G B E",
                "allStrings": ["e|...", "B|...", "G|...", "D|...", "A|...", "E|..."], # Placeholder for full tabs
                "singleStringOptions": []
            }
        }

    except Exception as e:
        print(f"Error analyzing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
