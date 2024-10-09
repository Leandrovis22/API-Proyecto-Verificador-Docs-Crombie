const express = require('express');
const router = express.Router();
const dniController = require('../controllers/dniController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const checkController = require('../controllers/checkController');
const Tiqueteria = require('../controllers/tiqueteriaController');
const Ticket = require('../controllers/components/ticket');
const Tickets = require('../controllers/components/tickets');

router.get('/users', userController.getUsers); //Solo para development trae info de todos los user se debera quitar al final

router.get('/user', authenticateToken, userController.getUser);

router.post('/process-dni', authenticateToken, dniController.processDNI);

router.get('/check-data', authenticateToken, checkController.checkData);	

router.get('/tiqueteria', authenticateToken, Tiqueteria.Tiqueteria)

//ruta para obtener imagenes

router.get('/image', authenticateToken, Ticket.getTicket);

router.get('/images', authenticateToken, Tickets.getTickets);

// router.get('/user', authenticateToken, userController.getUser); // Obtener los datos del usuario
//router.get('/user/dni-images', authenticateToken, dniController.getDniImages); // Obtener las URLs firmadas de las imágenes del DNI
// router.put('/user', authenticateToken, userController.updateUser); // Actualizar los datos del usuario
// router.delete('/user', authenticateToken, userController.deleteUser); //Borra usuario y todos sus datos, imagenes incluidas

module.exports = router;
