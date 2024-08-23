const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const formController = require('../controllers/formController');
const authenticateToken = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/users', loginController.getUsers); //Solo para development se debera quitar al final

router.post('/register', loginController.register);

router.post('/login', loginController.login);

// Rutas protegidas con JWT
router.put('/user', authenticateToken, loginController.updateUser); // Actualizar los datos de login
router.delete('/user', authenticateToken, loginController.deleteUser); //borra usuario y todos sus datos

router.post('/form', authenticateToken, formController.createForm);  // Ruta para crear form

/* router.get('/forms', authenticateToken, formController.getForms); // Obtener todos los form de un usuario con links de imagen
router.get('/file/:fileName', authenticateToken, formController.getSignedUrl); //obtener un unico link de imagen por nombre de archivo
router.put('/forms/:id', authenticateToken, formController.updateForm); //Ruta para actualizar un form
router.delete('/forms/:id', authenticateToken, formController.deleteForm); // Eliminar un formulario por ID de form especifico
router.delete('/forms', authenticateToken, formController.deleteFormsByUser); // Eliminar todos los formularios de un usuario */

module.exports = router;
