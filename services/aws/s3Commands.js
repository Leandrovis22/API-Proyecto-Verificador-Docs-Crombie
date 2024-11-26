const { DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3Config');

class S3Commands {
  static async deleteObject(bucketName, fileName) {
    const params = { 
      Bucket: bucketName, 
      Key: fileName 
    };
    return await s3Client.send(new DeleteObjectCommand(params));
  }

  static async putObject(bucketName, fileName, body, contentType) {
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: body,
      ContentType: contentType
    };
    return await s3Client.send(new PutObjectCommand(params));
  }

}

module.exports = S3Commands;