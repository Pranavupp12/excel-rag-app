// routes/excelRoutes.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const queryController = require('../controllers/queryController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadController);
router.post('/query', queryController);

module.exports = router;