//controllers/checkController.js

const { PrismaClient } = require('@prisma/client');
const { verificarDatos } = require('../utils/verificacionUtils'); // Asegúrate de que la ruta sea correcta

const prisma = new PrismaClient();

// Controlador para mostrar los resultados del análisis de DNI
exports.checkDNIResults = async (req, res) => {
  try {
    const userId = req.user.id; // Asegúrate de que req.user esté definido

    // Buscar el ticket más reciente del usuario
    const ticket = await prisma.tiqueteria.findFirst({
      where: { usuarioId: userId },
      orderBy: { createdAt: 'desc' } // Obtener el ticket más reciente
    });

    if (!ticket) {
      return res.status(404).json({ error: 'No se encontró ningún ticket para este usuario' });
    }

    // Buscar el registro de DNI asociado al ticket
    const dniRecord = await prisma.dni.findUnique({
      where: { tiqueteriaId: ticket.id }
    });

    if (!dniRecord) {
      return res.status(404).json({ error: 'No se encontraron resultados para el ticket actual' });
    }

    // Extraer los datos del texto analizado
    const { frente, detras } = dniRecord.resTextract;

    // Datos de verificación proporcionados en el request
    const requestData = {
      nombre: req.body.nombre || '',
      apellido: req.body.apellido || '',
      dni: req.body.dni || '',
      cuil: req.body.cuil || ''
    };

    // Verificar los datos usando verificarDatos
    const verificacion = await verificarDatos(frente, detras, requestData);

    // Responder con los resultados de Textract, el resultado de verificación y cualquier mensaje de error
    res.status(200).json({
      estado: ticket.estado,
      resultadoTextract: dniRecord.resTextract,
      mensajeError: ticket.msqError || 'No hubo errores',
      verificacion: verificacion // Incluye el resultado de la verificación
    });

  } catch (err) {
    console.error('Error al recuperar los resultados:', err);
    res.status(500).json({ error: 'Error al recuperar los resultados del ticket' });
  }
};
