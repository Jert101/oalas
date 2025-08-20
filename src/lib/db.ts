import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function query<T extends RowDataPacket[][] | ResultSetHeader>(
  sql: string,
  params?: (string | number | boolean | null)[]
) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,      // Your InfinityFree MySQL hostname (e.g., sql123.epizy.com)
    user: process.env.DB_USER,      // Your InfinityFree MySQL username
    password: process.env.DB_PASS,  // Your InfinityFree MySQL password
    database: process.env.DB_NAME,  // Your InfinityFree database name
    ssl: {
      rejectUnauthorized: false     // Required for InfinityFree MySQL connection
    }
  });

  try {
    const [results] = await connection.execute<T>(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}
