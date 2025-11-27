# Musicify – AI-Assisted Chord & Tab Analyzer

Full-stack app built with **Node.js + Express**, **React**, and a **SQLite** database (via `better-sqlite3`).

Upload an audio file, the backend "analyzes" it (currently a demo ML stub), and the UI shows:

- Detected chord progressions per song section.
- Guitar notes and full-string tabs.
- Optional single-string tabs.
- A history of previous analyses.

> **Note:** The current analyzer is a _placeholder_ that returns realistic-looking demo data. You can later plug in a real ML/DL model for true chord and tab detection.

---

## 1. Tech Stack

- **Backend**: Node.js, Express, Multer (file uploads), better-sqlite3 (SQLite), UUID.
- **Database**: SQLite file at `data/musicify.db` for metadata & analysis results.
- **Storage**: Raw audio files saved under `backend/uploads/`.
- **Frontend**: React (Vite-based), calling the backend REST API.

SQLite is a great choice here because:

- It is lightweight and file-based (no extra DB server to install).
- Perfect for local dev and desktop-style tools.
- Easy to migrate to PostgreSQL/MySQL later if you want cloud scale.

For production, you would typically store **audio files** in object storage (e.g. S3) and keep **metadata/analysis** in PostgreSQL.

---

## 2. Project Structure

```text
Musicify/
  backend/
    package.json
    src/
      server.js
      config/
        db.js
      routes/
        audioRoutes.js
      controllers/
        audioController.js
      services/
        audioAnalyzer.js
    uploads/           # created at runtime
  frontend/            # React app (Vite) – to be scaffolded
  data/
    musicify.db        # created automatically at first run
  README.md
```

---

## 3. Backend – Setup & Run (localhost)

### 3.1 Install dependencies

From the `backend` folder:

```bash
cd backend
npm install
```

This installs:

- `express`, `cors`, `multer`, `better-sqlite3`, `uuid`
- `nodemon` (for auto-restart during development)

### 3.2 Run the backend server

```bash
npm run dev
```

The backend will start on:

- `http://localhost:5000`

You can verify it by opening:

- `http://localhost:5000/` → should return JSON: `{ "message": "Musicify backend is running" }`

---

## 4. Backend API

### POST `/api/audio/analyze`

Upload and analyze an audio file.

- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Field**: `file` – the audio file (any common audio format)

**Response (201)**

```json
{
  "id": "<analysisId>",
  "trackId": "<trackId>",
  "summary": "Demo analysis only...",
  "chords": [
    { "section": "Intro", "progression": ["Cmaj7", "G", "Am7", "Fmaj7"] }
  ],
  "tabs": {
    "tuning": "E A D G B E",
    "allStrings": ["e|..."],
    "singleStringOptions": [
      { "string": "high E", "tab": "e|..." }
    ]
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "fileName": "my-song.mp3"
}
```

### GET `/api/audio`

List previous analyses (for the history panel in the UI).

### GET `/api/audio/:id`

Get full details (chords + tabs) for a specific analysis.

---

## 5. Frontend – React (Vite)

### 5.1 Scaffold the app (once)

From the **Musicify** root folder:

```bash
npm create vite@latest frontend -- --template react
```

Then install dependencies:

```bash
cd frontend
npm install
```

I will then customize:

- A **premium, music-themed UI** with gradients, glassmorphism, and responsive layout.
- Upload panel with drag-and-drop + file picker.
- Analysis view (chord sections, tab display, single-string tab selector).
- History sidebar for past analyses.

### 5.2 Run the frontend dev server

From the `frontend` folder:

```bash
npm run dev
```

By default Vite runs on something like:

- `http://localhost:5173` (or another port it prints)

The React app will call the backend at `http://localhost:5000`.

---

## 6. Replacing the Demo Analyzer with Real ML/DL

The current logic lives in:

- `backend/src/services/audioAnalyzer.js`

This function:

```js
async function analyzeAudio(filePath, metadata) {
  // TODO: replace with real ML/DL pipeline
  return { summary, chords, tabs };
}
```

You can replace it with a real pipeline, for example:

- A **Python service** (FastAPI/Flask) using `librosa` + a chord recognition model.
- A **local model server** you run separately, which takes an audio file path and returns JSON with chords/tabs.

Suggested integration pattern:

1. Node receives the upload and saves it under `backend/uploads/`.
2. Node calls your Python/ML service (e.g. `http://localhost:8000/analyze`) with the file path.
3. The ML service returns chords + tabs JSON.
4. Node stores that JSON into SQLite and responds to the React app.

This keeps the **Node.js API stable** while you experiment with different ML/DL models.

---

## 7. Next Steps

- Implement the premium React UI and connect it to the API endpoints.
- Extend the database schema if you want per-section timing, tempo, key, etc.
- Plug in a real ML/DL model for accurate chord and tab extraction.
