const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  uploadAndAnalyze,
  listAnalyses,
  getAnalysis,
  analyzeYoutube,
} = require('../controllers/audioController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post('/analyze', upload.single('file'), uploadAndAnalyze);
router.post('/analyze-youtube', analyzeYoutube);
router.get('/', listAnalyses);
router.get('/:id', getAnalysis);

module.exports = router;
