const cloudinary = require('../config/cloudinary');
const { db, admin } = require('../config/firebase');

async function uploadPhoto(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'photo_file_required' });
    }

    // Stream the buffer to Cloudinary (memory storage, no temp files on disk)
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `users/${userId}/photos`, resource_type: 'image' },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const docRef = await db.collection('photos').add({
      user_id: userId,
      cloudinary_public_id: uploadResult.public_id,
      cloudinary_url: uploadResult.secure_url,
      uploaded_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: docRef.id,
      cloudinary_url: uploadResult.secure_url,
    });
  } catch (err) {
    console.error('uploadPhoto error:', err);
    res.status(500).json({ error: 'upload_failed', message: err.message });
  }
}

module.exports = { uploadPhoto };
