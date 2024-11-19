const path = require('path');
const S3Commands = require('./s3Commands');
const sharp = require('sharp');

class S3Service {
  constructor(bucketName) {
    this.bucketName = bucketName;
  }

  async uploadImage(file, dni) {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${dni}-${Date.now()}${fileExtension}`;
      const compressedImage = await sharp(file.buffer)
        .resize(600)
        .jpeg({ quality: 80 })
        .toBuffer();

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

const s3Service = new S3Service(process.env.AWS_BUCKET_NAME);

module.exports = {
  S3Service,
  uploadImage: (file, dni) => s3Service.uploadImage(file, dni),
  deleteFile: (fileName) => s3Service.deleteFile(fileName),
  deleteFiles: (fileNames) => s3Service.deleteFiles(fileNames),
};
