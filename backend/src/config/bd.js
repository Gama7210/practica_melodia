import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const bd = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'melodia_app',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

bd.getConnection()
  .then(c => { console.log('✅ BD melodia_app conectada'); c.release(); })
  .catch(e => console.error('❌ Error BD:', e.message));

export default bd;
