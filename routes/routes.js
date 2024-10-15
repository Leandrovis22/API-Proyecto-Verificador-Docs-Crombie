const express = require('express');
const router = express.Router();
const dniController = require('../controllers/dniController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const checkController = require('../controllers/checkController');
const { sendResetPasswordEmail, resetPassword } = require('../controllers/forgotPass');
const { actualizarUsuario, obtenerUsuarios } = require('../controllers/adminController');

router.get('/users', userController.getUsers); //Solo para development trae info de todos los user se debera quitar al final

router.get('/user', authenticateToken, userController.getUser);

router.post('/process-dni', authenticateToken, dniController.processDNI);

router.get('/check-data', authenticateToken, checkController.checkData);	

router.post('/forgotpassword', sendResetPasswordEmail);

router.post('/reset-password/:token', resetPassword);

router.patch('/actUsu', actualizarUsuario);

router.get('/obtenerUsuarios', obtenerUsuarios)
// router.get('/user', authenticateToken, userController.getUser); // Obtener los datos del usuario
//router.get('/user/dni-images', authenticateToken, dniController.getDniImages); // Obtener las URLs firmadas de las imágenes del DNI
// router.put('/user', authenticateToken, userController.updateUser); // Actualizar los datos del usuario
// router.delete('/user', authenticateToken, userController.deleteUser); //Borra usuario y todos sus datos, imagenes incluidas

module.exports = router;
