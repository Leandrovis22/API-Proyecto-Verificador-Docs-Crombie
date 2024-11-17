const path = require('path');
const S3Commands = require('./s3Commands');

class S3Service {
  constructor(bucketName) {
    this.bucketName = bucketName;
  }

  generateFileName(file, dni) {
    const fileExtension = path.extname(file.originalname);
    return `${dni}-${Date.now()}${fileExtension}`;
  }

  async uploadImage(file, dni) {
    try {
      const fileName = this.generateFileName(file, dni);
      const compressedImage = await S3Commands.compressImage(file.buffer);

      await S3Commands.putObject(
        this.bucketName,
        fileName,
        compressedImage,
        file.mimetype
      );

      return fileName;
    } catch (error) {
      console.error('Error en uploadImage:', error);
      throw new Error('Error al subir la imagen a S3');
    }
  }

  async deleteFile(fileName) {
    try {
      if (!fileName) return;
      await S3Commands.deleteObject(this.bucketName, fileName);
    } catch (error) {
      console.error('Error en deleteFile:', error);
      throw new Error('Error al eliminar el archivo de S3');
    }
  }

  async deleteFiles(fileNames) {
    try {
      if (!Array.isArray(fileNames)) {
        throw new TypeError('fileNames debe ser un array');
      }

      const deletePromises = fileNames
        .filter(fileName => fileName)
        .map(fileName => this.deleteFile(fileName));

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error en deleteFiles:', error);
      throw new Error('Error al eliminar múltiples archivos de S3');
    }
  }
}

module.exports = new S3Service(process.env.AWS_BUCKET_NAME);

