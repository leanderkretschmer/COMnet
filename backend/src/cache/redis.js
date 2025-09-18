const redis = require('redis');

let client;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Fehler bei der Redis-Verbindung:', error);
    throw error;
  }
};

const getClient = () => {
  if (!client) {
    throw new Error('Redis-Client nicht initialisiert');
  }
  return client;
};

// Cache helper functions
const cache = {
  async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET Fehler:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis SET Fehler:', error);
    }
  },

  async del(key) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Redis DEL Fehler:', error);
    }
  },

  async exists(key) {
    try {
      return await client.exists(key);
    } catch (error) {
      console.error('Redis EXISTS Fehler:', error);
      return false;
    }
  }
};

module.exports = {
  connectRedis,
  getClient,
  cache
};
