const axios = require('axios');
const path = require('path');

// Fallback demo data in case Python service is down
const getDemoAnalysis = () => {
  const sections = ['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'];
  const chords = ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Em7', 'Fmaj7', 'Bbmaj7', 'Ebmaj7'];

  const demoChords = [];
  let currentTime = 0.0;

  for (let i = 0; i < 20; i++) {
    const duration = 2.0 + Math.random() * 2.0;
    demoChords.push({
      time: parseFloat(currentTime.toFixed(2)),
      duration: parseFloat(duration.toFixed(2)),
      chord: chords[Math.floor(Math.random() * chords.length)],
      section: sections[Math.floor(Math.random() * sections.length)]
    });
    currentTime += duration;
  }

  return {
    summary: "Demo Analysis (Python service unavailable). Please ensure the Python analyzer is running on port 8001.",
    chords: demoChords,
    tabs: {
      tuning: "E A D G B E",
      allStrings: [
        "e|-----------------0-0-0-0---------------------|",
        "B|-----------1----------------3----------------|",
        "G|-------0------------------------0-----------|",
        "D|---2-------------------------------2--------|",
        "A|-3------------------------------------------|",
        "E|--------------------------------------------|"
      ],
      singleStringOptions: [
        { string: "high E", tab: "e|--0-3-5-7-8-7-5-3-0-----------0-3-5-7-5-3-0-----|" },
        { string: "B", tab: "B|--1-3-5-6-8-6-5-3-1-----------1-3-5-6-5-3-1-----|" }
      ]
    }
  };
};

async function analyzeAudio(filePath, metadata) {
  try {
    // Try to call the Python service
    const pythonServiceUrl = process.env.PYTHON_ANALYZER_URL || 'http://127.0.0.1:8001';
    const absolutePath = path.resolve(filePath);

    console.log(`Sending analysis request to ${pythonServiceUrl}/analyze for ${absolutePath}`);

    const response = await axios.post(`${pythonServiceUrl}/analyze`, {
      filePath: absolutePath,
      metadata: metadata
    });

    console.log('Analysis successful');
    return response.data;

  } catch (error) {
    console.error('Python analysis service failed, falling back to demo data:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure the Python service is running: cd backend/python && uvicorn analyzer_service:app --reload --port 8001');
    }
    return getDemoAnalysis();
  }
}

module.exports = { analyzeAudio };
