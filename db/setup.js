import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setup() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
  const dbName = process.env.DB_NAME || 'github_analyzer';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  
  let connection;
  try {
    // Try connecting directly to the database first (supports shared hosts like Clever Cloud/Aiven)
    try {
      connection = await mysql.createConnection({
        host,
        user,
        password,
        port,
        database: dbName
      });
      console.log(`Connected directly to existing database '${dbName}'.`);
    } catch (dbError) {
      // If error is that the database doesn't exist, try connecting without DB name and creating it (for local dev)
      if (dbError.code === 'ER_BAD_DB_ERROR' || dbError.errno === 1049) {
        console.log(`Database '${dbName}' not found. Attempting to connect to host to create it...`);
        connection = await mysql.createConnection({
          host,
          user,
          password,
          port
        });
        console.log(`Creating database '${dbName}'...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.query(`USE \`${dbName}\``);
      } else {
        throw dbError; // Rethrow other errors (authentication, bad hostname, etc.)
      }
    }

    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split queries by semicolon. This simple approach is safe for our schema.sql.
    const queries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`Executing DDL queries (${queries.length} statements)...`);
    for (const query of queries) {
      // Clean query by removing SQL comments and leading/trailing whitespace
      const cleanQuery = query
        .replace(/--.*$/gm, '') // Remove single-line comments (-- ...)
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments (/* ... */)
        .trim();

      if (!cleanQuery) continue; // Skip empty query statements

      // Skip database creation and selection in SQL, as we connect to the database directly
      if (cleanQuery.toUpperCase().startsWith('CREATE DATABASE') || cleanQuery.toUpperCase().startsWith('USE')) {
        console.log(`Skipping DB-level statement: "${cleanQuery.substring(0, 30)}..."`);
        continue;
      }
      
      await connection.query(query);
    }

    console.log('🎉 Database and tables setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setup();
