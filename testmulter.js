const express = require('express');
const multer = require('multer');
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), (req, res) => {
  res.send('Archivo recibido');
});

app.listen(3001, () => {
  console.log('Servidor de prueba corriendo en el puerto 3001');
});
