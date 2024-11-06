const express = require('express');
const router = express.Router();
const dniController = require('../controllers/dniController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const checkController = require('../controllers/checkController');
const { getImageTicket } = require('../controllers/components/imageTicket');
const { getTickets } = require('../controllers/components/tickets');
const Tiqueteria = require('../controllers/tiqueteriaController');
const { sendResetPasswordEmail, resetPassword } = require('../controllers/forgotPass');
const { actualizarUsuario, obtenerUsuarios } = require('../controllers/adminController');

// Ruta para obtener datos del usuario actual
router.get('/user', authenticateToken, userController.getUser);

// Ruta para actualizar un usuario solo como admin
router.put('/user', authenticateToken, actualizarUsuario); // Agregar permitir al admin cambiar la contraseña del usuario?

// Ruta para obtener todos los usuarios como admin
router.get('/users', authenticateToken, obtenerUsuarios);

// Ruta para enviar el correo con link para restablecer contraseña
router.post('/forgot-password', sendResetPasswordEmail);

// Ruta para restablecer la contraseña usando el link anterior
router.post('/reset-password/:token', resetPassword);

router.post('/process-dni', authenticateToken, dniController.processDNI);

// Ruta para obtener una imagen url solo de dni frente de una sola persona a la vez
router.get('/image/:ticketId', authenticateToken, getImageTicket);

// Ruta para obtener las dos imagenes url del dni frente y detras de una sola persona a la vez
router.get('/tickets', authenticateToken, getTickets)

router.get('/check-data', authenticateToken, checkController.checkData);

// Ruta para obtener un ticket o todos los tickets segun rol, solo datos no imagenes
router.get('/tiqueteria', authenticateToken, Tiqueteria.Tiqueteria); // Hay que modificar de  resultado: ticket.msqError, a resultado: ticket.resultado, 


module.exports = router;