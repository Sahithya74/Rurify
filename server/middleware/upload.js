const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const csvUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const isCsvExt = file.originalname.toLowerCase().endsWith('.csv');
    if (allowed.includes(file.mimetype) || isCsvExt) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only .csv files are allowed'));
    }
  },
});

module.exports = { csvUpload };
