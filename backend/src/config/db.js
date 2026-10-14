require('dotenv').config();
const { Pool } = require('pg');

const NEON_DB_URL = 'postgresql://neondb_owner:npg_TW0PpCe9KLjz@ep-super-bar-b4hhuowo-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const connectionString = process.env.DATABASE_URL || NEON_DB_URL;
const isLocal = connectionString.includes('localhost');

const pool = new Pool({
  connectionString: connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 20, // High traffic / rush ke liye 20 simultaneous connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
});

module.exports = pool;