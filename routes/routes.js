const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const formController = require('../controllers/formController');
const authenticateToken = require('../middlewares/authMiddleware');

// Rutas protegidas con JWT
router.put('/login', authenticateToken, loginController.updateLogin); // Actualizar los datos de login
router.delete('/login', authenticateToken, loginController.deleteLogin); //borra usuario y todos sus datos
router.get('/forms', authenticateToken, formController.getForms); // Obtener todos los form de un usuario con links de imagen
router.get('/file/:fileName', authenticateToken, formController.getSignedUrl); //obtener un unico link de imagen por nombre de archivo
router.post('/createForm', authenticateToken, formController.createForm);  // Ruta para crear form
router.put('/forms/:id', authenticateToken, formController.updateForm); //Ruta para actualizar un form
router.delete('/forms/:id', authenticateToken, formController.deleteForm); // Eliminar un formulario por ID de form especifico
router.delete('/forms', authenticateToken, formController.deleteFormsByUser); // Eliminar todos los formularios de un usuario

// Rutas públicas
router.post('/register', loginController.register);
router.post('/login', loginController.login);

router.get('/logins', loginController.getLogins); //Solo para development se debera quitar al final

module.exports = router;
