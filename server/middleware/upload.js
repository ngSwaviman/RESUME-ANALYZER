const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const maxSizeMb = Number(process.env.MAX_RESUME_SIZE_MB) || 5;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${unique}.pdf`);
  },
});

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  if (isPdfMime && isPdfExt) return cb(null, true);
  return cb(ApiError.badRequest('Only PDF resumes are accepted. Please upload a .pdf file.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024, files: 1 },
});

/** Single resume upload with multer error translation. */
const uploadResume = (req, res, next) => {
  upload.single('resume')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest(`Resume is too large. Maximum allowed size is ${maxSizeMb} MB.`));
      }
      return next(ApiError.badRequest(`Upload failed: ${error.message}`));
    }
    return next(error);
  });
};

/** Delete a stored file, ignoring missing files. */
const removeFile = (filePath) => {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
};

module.exports = { uploadResume, removeFile, UPLOAD_DIR, maxSizeMb };
