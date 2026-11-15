const { Pool } = require('pg');
require('dotenv').config();
const { TOTAL_TICKETS, INITIAL_PARTICIPANTS } = require('../constants/initialData');

// Configure connection pool with fallback values
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'rifa',
      }
);

/**
 * Execute a query with the configured pool
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Connects to PostgreSQL with exponential backoff retries.
 * Essential for docker-compose environments where the db might take seconds to start.
 */
async function connectWithRetry(retries = 10, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('Connected successfully to PostgreSQL database.');
      return;
    } catch (err) {
      console.warn(`Database connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) {
        throw new Error(`Could not connect to PostgreSQL after ${retries} attempts: ${err.message}`);
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

/**
 * Initializes database tables, indexes, and seeds initial participant data if empty.
 */
async function initDb() {
  await connectWithRetry();

  // Create table if not exists
  await query(`
    CREATE TABLE IF NOT EXISTS tickets (
      ticket_number VARCHAR(2) PRIMARY KEY,
      buyer_name VARCHAR(255),
      status VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'pendiente', 'abono', 'pagado')),
      amount_paid INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
      notes TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_tickets_buyer ON tickets(buyer_name);
  `);

  // Check if tickets table is empty
  const countResult = await query('SELECT COUNT(*) AS count FROM tickets;');
  const count = parseInt(countResult.rows[0].count, 10);

  if (count === 0) {
    console.log('Initializing tickets with existing raffle participant data...');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create a map for quick lookup of existing participants
      const initialMap = new Map();
      for (const item of INITIAL_PARTICIPANTS) {
        initialMap.set(item.number, item);
      }

      // Insert all 100 tickets (00 to 99)
      for (let i = 0; i < TOTAL_TICKETS; i++) {
        const num = String(i).padStart(2, '0');
        const participant = initialMap.get(num);

        if (participant) {
          await client.query(
            `INSERT INTO tickets (ticket_number, buyer_name, status, amount_paid, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              num,
              participant.name,
              participant.status,
              participant.amountPaid,
              'Cargado de lista inicial'
            ]
          );
        } else {
          await client.query(
            `INSERT INTO tickets (ticket_number, buyer_name, status, amount_paid)
             VALUES ($1, NULL, 'disponible', 0)`,
            [num]
          );
        }
      }

      await client.query('COMMIT');
      console.log(`Successfully seeded ${TOTAL_TICKETS} tickets with ${INITIAL_PARTICIPANTS.length} active participants.`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to seed initial tickets:', error);
      throw error;
    } finally {
      client.release();
    }
  } else {
    console.log(`Database already contains ${count} tickets. Retaining existing live data.`);
  }
}

module.exports = {
  pool,
  query,
  initDb
};
