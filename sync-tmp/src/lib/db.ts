import mysql, { RowDataPacket, ResultSetHeader, Pool } from 'mysql2/promise';

// Create a connection pool for better performance
let pool: Pool;

// Prefer DATABASE_URL if provided; fall back to discrete DB_* vars
if (process.env.DATABASE_URL) {
  // mysql2 supports connection strings; append ssl=false unless query params already present
  const hasQuery = process.env.DATABASE_URL.includes("?");
  const dsn = hasQuery ? process.env.DATABASE_URL : `${process.env.DATABASE_URL}?ssl=false`;
  pool = mysql.createPool(dsn as string);
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    // keep SSL permissive by default to avoid self-signed issues
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Note: mysql2 ignores unsupported options like acquireTimeout/timeout/reconnect at pool level
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

export async function query<T extends RowDataPacket[][] | ResultSetHeader>(
  sql: string,
  params?: (string | number | boolean | null)[]
) {
  try {
    const [results] = await pool.execute<T>(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closePool() {
  await pool.end();
}
