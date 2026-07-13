const express = require('express');
const multer = require('multer');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const { uploadPhoto } = require('../controllers/photos.controller');

// Memory storage — file stays in RAM as a buffer, streamed straight to Cloudinary,
// never written to disk. 10MB cap matches the express.json limit used elsewhere.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/photos/upload   multipart/form-data, field name: "photo"
router.post('/upload', requireAuth, upload.single('photo'), uploadPhoto);

module.exports = router;
