const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const db = require('../config/db');
const analyzeAudio = require('../services/audioAnalyzer');

const insertTrackStmt = db.prepare(`
  INSERT INTO tracks (id, original_filename, stored_filename, mimetype, size, duration_seconds, created_at)
  VALUES (@id, @original_filename, @stored_filename, @mimetype, @size, @duration_seconds, @created_at)
`);

const insertAnalysisStmt = db.prepare(`
  INSERT INTO analyses (id, track_id, chords_json, tabs_json, summary, created_at)
  VALUES (@id, @track_id, @chords_json, @tabs_json, @summary, @created_at)
`);

const selectAnalysesStmt = db.prepare(`
  SELECT 
    a.id,
    t.original_filename,
    t.created_at AS uploaded_at,
    a.summary,
    a.chords_json,
    a.created_at
  FROM analyses a
  JOIN tracks t ON t.id = a.track_id
  ORDER BY a.created_at DESC
`);

const selectAnalysisByIdStmt = db.prepare(`
  SELECT 
    a.id,
    t.original_filename,
    t.stored_filename,
    t.mimetype,
    t.size,
    a.summary,
    a.chords_json,
    a.tabs_json,
    a.created_at
  FROM analyses a
  JOIN tracks t ON t.id = a.track_id
  WHERE a.id = ?
`);

function resolveBaseUrl(req) {
  if (process.env.PUBLIC_BACKEND_URL) {
    return process.env.PUBLIC_BACKEND_URL.replace(/\/+$/, '');
  }
  return `${req.protocol}://${req.get('host')}`;
}

async function uploadAndAnalyze(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const file = req.file;
    const trackId = uuidv4();
    const analysisId = uuidv4();
    const now = new Date().toISOString();

    insertTrackStmt.run({
      id: trackId,
      original_filename: file.originalname,
      stored_filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      duration_seconds: null,
      created_at: now,
    });

    const filePath = path.join(file.destination, file.filename);

    const analysis = await analyzeAudio(filePath, {
      originalName: file.originalname,
      mimetype: file.mimetype,
    });

    insertAnalysisStmt.run({
      id: analysisId,
      track_id: trackId,
      chords_json: JSON.stringify(analysis.chords),
      tabs_json: JSON.stringify(analysis.tabs),
      summary: analysis.summary,
      created_at: now,
    });

    const baseUrl = resolveBaseUrl(req);
    const audioUrl = `${baseUrl}/uploads/${file.filename}`;

    return res.status(201).json({
      id: analysisId,
      trackId,
      summary: analysis.summary,
      chords: analysis.chords,
      tabs: analysis.tabs,
      createdAt: now,
      fileName: file.originalname,
      audioUrl,
    });
  } catch (err) {
    console.error('Error analyzing audio:', err);
    return res.status(500).json({
      error: 'Failed to analyze audio',
      details: err.message,
    });
  }
}

function listAnalyses(req, res) {
  try {
    const rows = selectAnalysesStmt.all();

    const keyScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

    const mapped = rows.map((row) => {
      let chordsPreview = [];
      let romanPreview = [];

      if (row.chords_json) {
        try {
          const chords = JSON.parse(row.chords_json);
          if (Array.isArray(chords) && chords.length > 0) {
            const first = chords[0];
            if (first && Array.isArray(first.progression)) {
              chordsPreview = first.progression.slice(0, 8);
              romanPreview = chordsPreview.map((chord) => {
                const match = String(chord).match(/^([A-G])/i);
                if (!match) return '?';
                const root = match[1].toUpperCase();
                const idx = keyScale.indexOf(root);
                return idx === -1 ? '?' : roman[idx];
              });
            }
          }
        } catch (err) {
          // ignore JSON issues per-row
        }
      }

      return {
        ...row,
        chords_preview: chordsPreview,
        roman_preview: romanPreview,
      };
    });

    return res.json(mapped);
  } catch (err) {
    console.error('Error fetching analyses:', err);
    return res.status(500).json({ error: 'Failed to list analyses' });
  }
}

function getAnalysis(req, res) {
  try {
    const id = req.params.id;
    const row = selectAnalysisByIdStmt.get(id);

    if (!row) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const baseUrl = resolveBaseUrl(req);
    const audioUrl = `${baseUrl}/uploads/${row.stored_filename}`;

    return res.json({
      id: row.id,
      fileName: row.original_filename,
      summary: row.summary,
      chords: JSON.parse(row.chords_json),
      tabs: JSON.parse(row.tabs_json),
      createdAt: row.created_at,
      audioUrl,
    });
  } catch (err) {
    console.error('Error fetching analysis:', err);
    return res.status(500).json({ error: 'Failed to fetch analysis' });
  }
}

async function analyzeYoutube(req, res) {
  try {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    const trackId = uuidv4();
    const analysisId = uuidv4();
    const now = new Date().toISOString();

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let videoTitle = 'YouTube audio';

    // Fetch the YouTube video title in a separate, lightweight call.
    try {
      await new Promise((resolve, reject) => {
        const titleArgs = ['--no-playlist', '--print', '%(title)s', url];
        const child = execFile('yt-dlp', titleArgs, (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }

          if (stdout) {
            const lines = String(stdout)
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean);
            if (lines.length > 0) {
              videoTitle = lines[lines.length - 1];
            }
          }
          resolve();
        });

        child.on('error', (spawnErr) => {
          reject(spawnErr);
        });
      });
    } catch (titleErr) {
      console.error('yt-dlp title fetch failed, falling back to default title:', titleErr);
    }

    // Download best audio into uploadsDir using a template based on trackId.
    const outputTemplate = path.join(uploadsDir, `${trackId}.%(ext)s`);

    await new Promise((resolve, reject) => {
      const args = ['-f', 'bestaudio/best', '-o', outputTemplate, '--no-playlist', url];

      const child = execFile('yt-dlp', args, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });

      child.on('error', (spawnErr) => {
        reject(spawnErr);
      });
    });

    // Locate the actual downloaded file (trackId with whatever extension yt-dlp chose).
    const files = fs.readdirSync(uploadsDir);
    const downloadedName = files.find((name) => name.startsWith(trackId));

    if (!downloadedName) {
      throw new Error(
        `Downloaded audio file not found for trackId ${trackId} in ${uploadsDir}. yt-dlp may have failed or used an unexpected output path.`,
      );
    }

    const filePath = path.join(uploadsDir, downloadedName);
    const stats = fs.statSync(filePath);
    const mimetype = 'audio/mpeg';

    insertTrackStmt.run({
      id: trackId,
      original_filename: videoTitle,
      stored_filename: downloadedName,
      mimetype,
      size: stats.size,
      duration_seconds: null,
      created_at: now,
    });

    const analysis = await analyzeAudio(filePath, {
      originalName: videoTitle,
      mimetype,
      youtubeUrl: url,
    });

    // Store analysis metadata and keep the downloaded audio file like regular uploads
    insertAnalysisStmt.run({
      id: analysisId,
      track_id: trackId,
      chords_json: JSON.stringify(analysis.chords),
      tabs_json: JSON.stringify(analysis.tabs),
      summary: analysis.summary,
      created_at: now,
    });

    const baseUrl = resolveBaseUrl(req);
    const audioUrl = `${baseUrl}/uploads/${downloadedName}`;

    return res.status(201).json({
      id: analysisId,
      trackId,
      summary: analysis.summary,
      chords: analysis.chords,
      tabs: analysis.tabs,
      createdAt: now,
      fileName: videoTitle,
      audioUrl,
      source: {
        type: 'youtube',
        url,
      },
    });
  } catch (err) {
    console.error('Error analyzing YouTube audio via yt-dlp:', err);
    return res.status(500).json({
      error: 'Failed to analyze YouTube URL',
      details: err.message,
    });
  }
}

module.exports = {
  uploadAndAnalyze,
  listAnalyses,
  getAnalysis,
  analyzeYoutube,
};
