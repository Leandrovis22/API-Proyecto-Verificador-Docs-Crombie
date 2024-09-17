const express = require('express');
const router = express.Router();
const dniController = require('../controllers/dniController');

router.post('/process-dni', dniController.processDNI);



// router.get('/user', authenticateToken, userController.getUser); // Obtener los datos del usuario
//router.get('/user/dni-images', authenticateToken, dniController.getDniImages); // Obtener las URLs firmadas de las imágenes del DNI
// router.put('/user', authenticateToken, userController.updateUser); // Actualizar los datos del usuario
// router.delete('/user', authenticateToken, userController.deleteUser); //Borra usuario y todos sus datos, imagenes incluidas

module.exports = router;
