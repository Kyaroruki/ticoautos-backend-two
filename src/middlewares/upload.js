const multer = require('multer');
// path nos ayuda a sacar la extension original del archivo.
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Exportamos upload para usarlo en rutas con upload.single('campo').
module.exports = upload;