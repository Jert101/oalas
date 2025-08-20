import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function query<T extends RowDataPacket[][] | ResultSetHeader>(
  sql: string,
  params?: (string | number | boolean | null)[]
) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [results] = await connection.execute<T>(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}
