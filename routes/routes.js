const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/users', userController.getUsers); //Solo para development se debera quitar al final
router.post('/register', userController.register); // Registrar un usuario, devuelve un token JWT
router.post('/login', userController.login); // Iniciar sesión, devuelve un token JWT

// Rutas protegidas con JWT, todo pide token
router.get('/user', authenticateToken, userController.getUser); // Obtener los datos del usuario
router.get('/user/dni-images', authenticateToken, userController.getDniImages); // Obtener las URLs firmadas de las imágenes del DNI
router.put('/user', authenticateToken, userController.updateUser); // Actualizar los datos del usuario
router.delete('/user', authenticateToken, userController.deleteUser); //Borra usuario y todos sus datos, imagenes incluidas

module.exports = router;
