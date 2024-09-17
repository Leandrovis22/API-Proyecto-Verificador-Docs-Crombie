// /routes/routes.js

const express = require('express');
const router = express.Router();
const dniController = require('../controllers/dniController');
const authenticateToken = require('../middlewares/authMiddleware');
const { uploadMiddleware } = require('../controllers/dniController'); // Asegúrate de exportar uploadMiddleware

// Rutas protegidas con JWT
router.post('/dni', authenticateToken, uploadMiddleware, dniController.processDNI);

// router.get('/user', authenticateToken, userController.getUser); // Obtener los datos del usuario
//router.get('/user/dni-images', authenticateToken, dniController.getDniImages); // Obtener las URLs firmadas de las imágenes del DNI
// router.put('/user', authenticateToken, userController.updateUser); // Actualizar los datos del usuario
// router.delete('/user', authenticateToken, userController.deleteUser); //Borra usuario y todos sus datos, imagenes incluidas

module.exports = router;
