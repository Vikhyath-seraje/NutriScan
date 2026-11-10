// middleware/upload.js
// ---------------------------------------------------------
// Multer configuration for meal image uploads.
// Features:
//   - Disk storage engine with unique timestamp + crypto hashes
//   - MIME type verification: JPEG, PNG, WebP only
//   - File size limit: 10 MB maximum
//   - Error wrapper middleware to catch Multer errors gracefully
// ---------------------------------------------------------

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const { sendError } = require('../utils/responseHelpers');

// If running in Vercel serverless, use os.tmpdir(), otherwise local uploads/meals
const isVercel = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadDirectory = isVercel
  ? path.join(os.tmpdir(), 'nutriscan_uploads')
  : path.join(__dirname, '..', 'uploads', 'meals');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// ── 1. Storage Engine ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    // Generate secure random name: meal-TIMESTAMP-RANDOMHEX.ext
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `meal-${Date.now()}-${randomSuffix}${ext}`);
  },
});

// ── 2. File Filter (MIME type check) ───────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    error.message = 'Unsupported file type. Please upload a JPG, PNG, or WebP image.';
    cb(error, false);
  }
};

// ── 3. Multer Instance ────────────────────────────────────
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabytes limit
    files: 1, // Only 1 meal photo per upload
  },
});

// ── 4. Wrapper Middleware for Consistent Error Responses ──
const uploadMealImage = (req, res, next) => {
  const singleUpload = upload.single('image');

  singleUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(
          res,
          'Image size too large. Maximum allowed size is 10 MB.',
          400
        );
      }
      return sendError(res, err.message || 'File upload error', 400);
    } else if (err) {
      return sendError(res, err.message || 'An error occurred during file upload', 400);
    }

    if (!req.file) {
      return sendError(res, 'Please provide an image file to upload.', 400);
    }

    next();
  });
};

module.exports = {
  uploadMealImage,
  uploadDirectory,
  ALLOWED_MIME_TYPES,
};
