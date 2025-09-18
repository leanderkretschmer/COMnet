const { Pool } = require('pg');

let pool;

const connectDatabase = async () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    console.log('PostgreSQL verbunden');
    client.release();

    return pool;
  } catch (error) {
    console.error('Fehler bei der Datenbankverbindung:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Datenbankpool nicht initialisiert');
  }
  return pool;
};

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ausgeführt', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Datenbankfehler:', error);
    throw error;
  }
};

const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  connectDatabase,
  getPool,
  query,
  getClient
};
