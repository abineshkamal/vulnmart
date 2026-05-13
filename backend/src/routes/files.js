const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

// POST /api/files/upload
router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  console.log(`[UPLOAD] File saved: ${req.file.path} by user ${req.user.username}`);

  res.json({
    message: 'File uploaded',
    filename: req.file.originalname,
    serverPath: req.file.path,
    url: `/api/files/download?file=${req.file.originalname}`,
  });
});

// GET /api/files/download?file=filename
router.get('/download', authenticate, (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: 'file param required' });

  const filePath = path.join(UPLOAD_DIR, file);

  console.log(`[DOWNLOAD] Serving file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found', attempted: filePath });
  }

  res.download(filePath);
});

// GET /api/files/view?file=filename
router.get('/view', authenticate, (req, res) => {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: 'file param required' });

  const filePath = path.join(UPLOAD_DIR, file);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.type('text/plain').send(content);
  } catch (err) {
    res.status(500).json({ error: err.message, path: filePath });
  }
});

// GET /api/files/list
router.get('/list', authenticate, (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    res.json({ files, directory: UPLOAD_DIR });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
