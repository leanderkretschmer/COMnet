const Minio = require('minio');

let minioClient;

const connectMinIO = async () => {
  try {
    minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'comnet',
      secretKey: process.env.MINIO_SECRET_KEY || 'comnet_password'
    });

    // Test connection
    const buckets = await minioClient.listBuckets();
    console.log('MinIO verbunden, verfügbare Buckets:', buckets.map(b => b.name));

    // Ensure required buckets exist
    await ensureBucket('comnet-uploads');
    await ensureBucket('comnet-avatars');
    await ensureBucket('comnet-communities');

    return minioClient;
  } catch (error) {
    console.error('Fehler bei der MinIO-Verbindung:', error);
    throw error;
  }
};

const ensureBucket = async (bucketName) => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket ${bucketName} erstellt`);
    }
  } catch (error) {
    console.error(`Fehler beim Erstellen des Buckets ${bucketName}:`, error);
  }
};

const getClient = () => {
  if (!minioClient) {
    throw new Error('MinIO-Client nicht initialisiert');
  }
  return minioClient;
};

// Storage helper functions
const storage = {
  async uploadFile(bucket, objectName, stream, metaData = {}) {
    try {
      const result = await minioClient.putObject(bucket, objectName, stream, metaData);
      return result;
    } catch (error) {
      console.error('MinIO Upload Fehler:', error);
      throw error;
    }
  },

  async getFile(bucket, objectName) {
    try {
      return await minioClient.getObject(bucket, objectName);
    } catch (error) {
      console.error('MinIO GET Fehler:', error);
      throw error;
    }
  },

  async deleteFile(bucket, objectName) {
    try {
      await minioClient.removeObject(bucket, objectName);
    } catch (error) {
      console.error('MinIO DELETE Fehler:', error);
      throw error;
    }
  },

  async getFileUrl(bucket, objectName, expiry = 7 * 24 * 60 * 60) {
    try {
      return await minioClient.presignedGetObject(bucket, objectName, expiry);
    } catch (error) {
      console.error('MinIO URL Fehler:', error);
      throw error;
    }
  },

  async listFiles(bucket, prefix = '') {
    try {
      const objectsList = [];
      const stream = minioClient.listObjects(bucket, prefix, true);
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => objectsList.push(obj));
        stream.on('error', reject);
        stream.on('end', () => resolve(objectsList));
      });
    } catch (error) {
      console.error('MinIO LIST Fehler:', error);
      throw error;
    }
  }
};

module.exports = {
  connectMinIO,
  getClient,
  storage
};
