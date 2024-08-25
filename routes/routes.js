const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const authenticateToken = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/users', loginController.getUsers); //Solo para development se debera quitar al final
router.post('/register', loginController.register); // Registrar un usuario, devuelve un token JWT
router.post('/login', loginController.login); // Iniciar sesión, devuelve un token JWT

// Rutas protegidas con JWT, todo pide token
router.get('/user', authenticateToken, loginController.getUser); // Obtener los datos del usuario
router.get('/user/dni-images', authenticateToken, loginController.getDniImages); // Obtener las URLs firmadas de las imágenes del DNI
router.put('/user', authenticateToken, loginController.updateUser); // Actualizar los datos del usuario
router.delete('/user', authenticateToken, loginController.deleteUser); //Borra usuario y todos sus datos, imagenes incluidas

module.exports = router;
