const cloudinary = require('../config/cloudinary');
const { supabaseAdmin } = require('../config/supabase');

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

    const { data: photo, error: dbErr } = await supabaseAdmin
      .from('photos')
      .insert({
        user_id: userId,
        cloudinary_public_id: uploadResult.public_id,
        cloudinary_url: uploadResult.secure_url,
      })
      .select()
      .single();

    if (dbErr) {
      console.error('Photo DB insert error:', dbErr);
      return res.status(500).json({ error: 'photo_save_failed' });
    }

    res.status(201).json({
      id: photo.id,
      cloudinary_url: photo.cloudinary_url,
    });
  } catch (err) {
    console.error('uploadPhoto error:', err);
    res.status(500).json({ error: 'upload_failed', message: err.message });
  }
}

module.exports = { uploadPhoto };
