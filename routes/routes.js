const express = require('express');
const router = express.Router();
const dniController = require('../controllers/dniController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const checkController = require('../controllers/checkController');
const { getTicket } = require('../controllers/components/ticket');
const { getTickets } = require('../controllers/components/tickets');
const Tiqueteria = require('../controllers/tiqueteriaController');

router.get('/users', userController.getUsers); //Solo para development trae info de todos los user se debera quitar al final

router.get('/user', authenticateToken, userController.getUser);

router.post('/process-dni', authenticateToken, dniController.processDNI);

// Ruta para obtener una imagen url solo de dni frente de una sola persona a la vez
router.get('/image', authenticateToken, getTicket);

// Ruta para obtener las dos imagenes url del dni frente y detras de una sola persona a la vez
router.get('/tickets', authenticateToken, getTickets)

router.get('/check-data', authenticateToken, checkController.checkData);

// Ruta para obtener un ticket o todos los tickets segun rol
router.get('/tiqueteria', authenticateToken, Tiqueteria.Tiqueteria) // Hay que modificar de  resultado: ticket.msqError, a resultado: ticket.resultado, 


module.exports = router;