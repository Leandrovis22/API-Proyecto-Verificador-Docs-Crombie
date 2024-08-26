const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const registerControler = require('../controllers/registerControler');
const formUsuario = require('../controllers/formUsuControler');
const authenticateToken = require('../middlewares/authMiddleware');

const upload = multer();

// Rutas públicas
router.get('/users', userController.getUsers); // Solo para desarrollo, se debería quitar al final
router.post('/register', upload.none(), registerControler.register);

// Ruta protegida que usa el middleware de autenticación
router.post('/formUsuario', authenticateToken, upload.fields([
    { name: 'dni_foto_delante', maxCount: 1 },
    { name: 'dni_foto_detras', maxCount: 1 }
]), formUsuario.formUsuario);

router.post('/login', userController.login); // Iniciar sesión, devuelve un token JWT

// Rutas protegidas con JWT
router.get('/user', authenticateToken, userController.getUser); // Obtener los datos del usuario
router.get('/user/dni-images', authenticateToken, userController.getDniImages); // Obtener las URLs firmadas de las imágenes del DNI
router.put('/user', authenticateToken, userController.updateUser); // Actualizar los datos del usuario
router.delete('/user', authenticateToken, userController.deleteUser); // Borrar usuario y todos sus datos, imágenes incluidas

module.exports = router;
