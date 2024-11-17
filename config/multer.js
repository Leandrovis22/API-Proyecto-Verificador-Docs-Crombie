const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes."));
    }
    cb(null, true);
  },
});

const uploadMiddleware = upload.fields([
  { name: "dni_foto_delante", maxCount: 1 },
  { name: "dni_foto_detras", maxCount: 1 },
]);

module.exports = {
  upload,
  uploadMiddleware
};