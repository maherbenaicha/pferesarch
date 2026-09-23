import sql from "mssql";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

// Parse la connection string style JDBC/ADO en config mssql
// Format: sqlserver://HOST:PORT;database=DB;user=USER;password=PASS;encrypt=true;trustServerCertificate=true
function parseConnectionString(connStr: string): sql.config {
  const withoutProtocol = connStr.replace(/^sqlserver:\/\//, "");
  const [hostPort, ...paramParts] = withoutProtocol.split(";");
  const [server, portStr] = hostPort.split(":");

  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const [key, ...rest] = part.split("=");
    if (key) params[key.toLowerCase()] = rest.join("=");
  }

  return {
    server: server || "localhost",
    port: portStr ? parseInt(portStr, 10) : 1433,
    database: params["database"],
    user: params["user"],
    password: params["password"],
    options: {
      encrypt: params["encrypt"] === "true",
      trustServerCertificate: params["trustservercertificate"] === "true",
    },
  };
}

const config = parseConnectionString(connectionString);

// Singleton pool pour dev (évite les reconnexions HMR Next.js)
const globalForDb = globalThis as typeof globalThis & {
  __mssqlPool?: sql.ConnectionPool;
};

export const pool: sql.ConnectionPool =
  globalForDb.__mssqlPool ?? new sql.ConnectionPool(config);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__mssqlPool = pool;
}

// Assure que le pool est connecté
let poolConnected = false;
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!poolConnected) {
    await pool.connect();
    poolConnected = true;
  }
  return pool;
}

// Helper : exécute une requête et retourne les lignes
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const p = await getPool();
  const request = p.request();

  let queryStr = "";
  strings.forEach((str, i) => {
    queryStr += str;
    if (i < values.length) {
      const paramName = `p${i}`;
      request.input(paramName, values[i]);
      queryStr += `@${paramName}`;
    }
  });

  const result = await request.query(queryStr);
  return result.recordset as T[];
}

// Re-export sql pour les types (ex: sql.Int, sql.NVarChar…)
export { sql };
