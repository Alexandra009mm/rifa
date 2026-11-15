const { query } = require('../config/db');
const { TICKET_PRICE, TOTAL_TICKETS } = require('../constants/initialData');

/**
 * Data Access Object for tickets table
 */
class TicketRepository {
  /**
   * Retrieves all tickets ordered by ticket number with optional filters.
   * @param {Object} filters
   * @param {string} [filters.query] - Case-insensitive search on buyer_name or ticket_number
   * @param {string} [filters.status] - Filter by status ('disponible', 'pendiente', 'abono', 'pagado')
   * @returns {Promise<Array>}
   */
  async findAll({ query: search, status } = {}) {
    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(buyer_name) LIKE $${values.length} OR ticket_number LIKE $${values.length})`);
    }

    if (status && ['disponible', 'pendiente', 'abono', 'pagado'].includes(status)) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        ticket_number AS "ticketNumber",
        buyer_name AS "buyerName",
        status,
        amount_paid AS "amountPaid",
        notes,
        updated_at AS "updatedAt"
      FROM tickets
      ${whereClause}
      ORDER BY ticket_number ASC;
    `;

    const result = await query(sql, values);
    return result.rows;
  }

  /**
   * Finds a single ticket by its two-digit number.
   * @param {string} number - Two digit ticket number (00-99)
   * @returns {Promise<Object|null>}
   */
  async findByNumber(number) {
    const sql = `
      SELECT 
        ticket_number AS "ticketNumber",
        buyer_name AS "buyerName",
        status,
        amount_paid AS "amountPaid",
        notes,
        updated_at AS "updatedAt"
      FROM tickets
      WHERE ticket_number = $1;
    `;
    const result = await query(sql, [number]);
    return result.rows[0] || null;
  }

  /**
   * Updates an existing ticket with buyer details and payment status.
   * @param {string} number - Two digit ticket number
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(number, { buyerName, status, amountPaid, notes }) {
    const sql = `
      UPDATE tickets
      SET 
        buyer_name = $1,
        status = $2,
        amount_paid = $3,
        notes = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE ticket_number = $5
      RETURNING 
        ticket_number AS "ticketNumber",
        buyer_name AS "buyerName",
        status,
        amount_paid AS "amountPaid",
        notes,
        updated_at AS "updatedAt";
    `;
    const result = await query(sql, [buyerName, status, amountPaid, notes || null, number]);
    return result.rows[0];
  }

  /**
   * Releases a ticket, returning it to 'disponible' state and clearing buyer and payment.
   * @param {string} number - Two digit ticket number
   * @returns {Promise<Object>}
   */
  async release(number) {
    const sql = `
      UPDATE tickets
      SET 
        buyer_name = NULL,
        status = 'disponible',
        amount_paid = 0,
        notes = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE ticket_number = $1
      RETURNING 
        ticket_number AS "ticketNumber",
        buyer_name AS "buyerName",
        status,
        amount_paid AS "amountPaid",
        notes,
        updated_at AS "updatedAt";
    `;
    const result = await query(sql, [number]);
    return result.rows[0];
  }

  /**
   * Resets all 100 tickets to available, clearing buyers and payments.
   * @returns {Promise<number>} Number of tickets reset
   */
  async resetAll() {
    const sql = `
      UPDATE tickets
      SET 
        buyer_name = NULL,
        status = 'disponible',
        amount_paid = 0,
        notes = NULL,
        updated_at = CURRENT_TIMESTAMP;
    `;
    const result = await query(sql);
    return result.rowCount;
  }

  /**
   * Calculates overall raffle statistics.
   * @returns {Promise<Object>}
   */
  async getStats() {
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE buyer_name IS NOT NULL) AS sold,
        COUNT(*) FILTER (WHERE buyer_name IS NULL) AS available,
        COUNT(*) FILTER (WHERE status = 'pagado') AS paid_count,
        COUNT(*) FILTER (WHERE status = 'abono') AS abono_count,
        COUNT(*) FILTER (WHERE status = 'pendiente') AS pending_count,
        COALESCE(SUM(amount_paid), 0) AS total_collected
      FROM tickets;
    `;
    const result = await query(sql);
    const row = result.rows[0];

    const sold = parseInt(row.sold, 10);
    const available = parseInt(row.available, 10);
    const paidCount = parseInt(row.paid_count, 10);
    const abonoCount = parseInt(row.abono_count, 10);
    const pendingCount = parseInt(row.pending_count, 10);
    const totalCollected = parseInt(row.total_collected, 10);

    const totalPotential = TOTAL_TICKETS * TICKET_PRICE;
    const soldPotential = sold * TICKET_PRICE;
    const pendingToCollect = soldPotential - totalCollected;

    return {
      sold,
      available,
      paidCount,
      abonoCount,
      pendingCount,
      ticketPrice: TICKET_PRICE,
      totalCollected,
      pendingToCollect,
      totalPotential
    };
  }
}

module.exports = new TicketRepository();
