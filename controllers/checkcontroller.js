
const { verificarDatos } = require('../utils/verificationUtils');

async function verificarDatosController(ticketId, userId) {
    try {
      // Obtener datos del usuario y DNI extraído
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId }
      });
  
      if (!usuario) throw new Error('Usuario no encontrado');
  
      const dniData = await prisma.dni.findFirst({
        where: { tiqueteriaId: ticketId }
      });
  
      if (!dniData) throw new Error('No se encontraron datos de DNI para verificar');
      
      // Comprobación de los datos extraídos con Textract
      const verificationResult = await verificarDatos(
        dniData.resTextract.frente,
        dniData.resTextract.detras,
        {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          dni: usuario.dni.toString(),
          cuil: usuario.cuil.toString()
        }
      );
  
      if (!verificationResult.success) {
        await prisma.tiqueteria.update({
          where: { id: ticketId },
          data: {
            estado: 'fallido',
            msqError: verificationResult.error,
          }
        });
        return;
      }
  
      // Si la verificación es exitosa, actualizar el estado
      await prisma.tiqueteria.update({
        where: { id: ticketId },
        data: { estado: 'completado' }
      });
  
    } catch (err) {
      console.error('Error en la verificación de datos:', err);
  
      await prisma.tiqueteria.update({
        where: { id: ticketId },
        data: { estado: 'fallido', msqError: err.message }
      });
    }
  }
  