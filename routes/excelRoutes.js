const express = require('express');
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const queryController = require('../controllers/queryController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Debug middleware BEFORE multer
router.post('/upload', (req, res, next) => {
  console.log('📥 Route hit: /upload');
  next();
}, upload.single('file'), (req, res, next) => {
  console.log('🔥 Multer processed file:', req.file ? req.file.originalname : '❌ No file');
  console.log('📦 File size:', req.file ? req.file.size : 'n/a');
  console.log('📄 MIME type:', req.file ? req.file.mimetype : 'n/a');
  next();
}, uploadController);

router.post('/query', (req, res, next) => {
  console.log('🔍 Query endpoint hit');
  next();
}, queryController);

module.exports = router;
