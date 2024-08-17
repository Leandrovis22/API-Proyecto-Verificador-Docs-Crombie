// s3Utils.js
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configuración de AWS S3
const s3Client = new S3Client({ region: process.env.AWS_REGION });

/**
 * Elimina un archivo del bucket de S3
 * @param {string} fileName - Nombre del archivo a eliminar
 * @returns {Promise<void>}
 */
async function deleteFile(fileName) {
  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
  } catch (error) {
    console.error('Error al eliminar el archivo de S3:', error);
    throw new Error('Error al eliminar el archivo de S3');
  }
}

/**
 * Elimina todos los archivos de un usuario del bucket de S3
 * @param {string[]} fileNames - Nombres de los archivos a eliminar
 * @returns {Promise<void>}
 */
async function deleteFiles(fileNames) {
  try {
    const deletePromises = fileNames.map(fileName => deleteFile(fileName));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error al eliminar archivos de S3:', error);
    throw new Error('Error al eliminar archivos de S3');
  }
}

module.exports = {
  deleteFile,
  deleteFiles,
};
