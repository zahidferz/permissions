const sql = require('mssql');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const config = {
  user: process.env.BOA_CORE_SQL_USER,
  password: process.env.BOA_CORE_SQL_PASS,
  server: process.env.BOA_CORE_SQL_HOST,
  database: process.env.BOA_CORE_SQL_DATABASE,
  options: {
    encrypt: true,
    connectTimeout: 3000,
  },
  pool: {
    max: 1024,
    min: 8,
    idleTimeoutMillis: 3000,
  },
};

export class SqlManager {
  constructor() {
    this.Pool = new sql.ConnectionPool(config);
  }
  async getConnection() {
    if (!this.connection) {
      this.connection = this.Pool.connect();
    }
    return this.connection;
  }
  async getTransaction(connection) {
    if (!connection) {
      connection = this.Pool.connect();
    }
    return connection.transaction();
  }
}

export const getSqlManager = async (req, res, next) => {
  try {
    if (!global.SqlManager) {
      global.SqlManager = new SqlManager();
    }
    res.locals.SqlManager = global.SqlManager;
    next();
  } catch (error) {
    throw new Error(`getSqlManager: ${error}`);
  }
};
