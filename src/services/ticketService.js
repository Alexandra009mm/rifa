const ticketRepository = require('../repositories/ticketRepository');
const { TICKET_PRICE, TOTAL_TICKETS } = require('../constants/initialData');

/**
 * Service handling business rules, validation, and calculations for tickets.
 */
class TicketService {
  /**
   * Normalize and validate a two-digit ticket number (00-99)
   * @param {string|number} rawNumber
   * @returns {string} Normalized 2-digit string
   */
  validateTicketNumber(rawNumber) {
    if (rawNumber === undefined || rawNumber === null) {
      throw new Error('Ticket number is required');
    }
    const numStr = String(rawNumber).trim().padStart(2, '0');
    const numInt = parseInt(numStr, 10);
    if (isNaN(numInt) || numInt < 0 || numInt >= TOTAL_TICKETS || numStr.length !== 2) {
      throw new Error(`Ticket number must be between 00 and ${String(TOTAL_TICKETS - 1).padStart(2, '0')}`);
    }
    return numStr;
  }

  /**
   * Retrieves all tickets with optional filtering.
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async listTickets(filters) {
    return ticketRepository.findAll(filters);
  }

  /**
   * Retrieves single ticket by number.
   * @param {string} rawNumber
   * @returns {Promise<Object>}
   */
  async getTicket(rawNumber) {
    const number = this.validateTicketNumber(rawNumber);
    const ticket = await ticketRepository.findByNumber(number);
    if (!ticket) {
      throw new Error(`Ticket ${number} not found`);
    }
    return ticket;
  }

  /**
   * Assigns or updates a buyer and payment details for a ticket.
   * @param {string} rawNumber
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async updateTicket(rawNumber, payload) {
    const number = this.validateTicketNumber(rawNumber);
    const existing = await ticketRepository.findByNumber(number);
    if (!existing) {
      throw new Error(`Ticket ${number} not found`);
    }

    const buyerName = payload.buyerName ? String(payload.buyerName).trim() : null;
    if (!buyerName) {
      throw new Error('Buyer name is required to assign a ticket');
    }

    let status = payload.status || 'pendiente';
    let amountPaid = Number(payload.amountPaid || 0);

    if (isNaN(amountPaid) || amountPaid < 0) {
      throw new Error('Amount paid must be a positive number');
    }

    // Business rules based on status
    if (status === 'pagado') {
      amountPaid = TICKET_PRICE;
    } else if (status === 'abono') {
      if (amountPaid <= 0) {
        throw new Error('Deposit amount (abono) must be greater than $0');
      }
      if (amountPaid >= TICKET_PRICE) {
        // Automatically promote to fully paid if deposit covers the full ticket price
        status = 'pagado';
        amountPaid = TICKET_PRICE;
      }
    } else if (status === 'pendiente') {
      amountPaid = 0;
    } else {
      throw new Error('Invalid status. Expected "pendiente", "abono", or "pagado"');
    }

    const notes = payload.notes ? String(payload.notes).trim() : null;

    return ticketRepository.update(number, {
      buyerName,
      status,
      amountPaid,
      notes
    });
  }

  /**
   * Releases a ticket back to available.
   * @param {string} rawNumber
   * @returns {Promise<Object>}
   */
  async releaseTicket(rawNumber) {
    const number = this.validateTicketNumber(rawNumber);
    return ticketRepository.release(number);
  }

  /**
   * Resets all tickets. Protected by mandatory confirmation text to avoid accidental clicks.
   * @param {string} confirmationText
   * @returns {Promise<{ success: boolean, count: number }>}
   */
  async resetAllTickets(confirmationText) {
    if (!confirmationText || confirmationText.trim().toUpperCase() !== 'REINICIAR') {
      throw new Error('Confirmation string "REINICIAR" is required to prevent accidental reset.');
    }
    const count = await ticketRepository.resetAll();
    return { success: true, count };
  }

  /**
   * Returns calculated stats for tickets, sold count, and funds collected.
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    return ticketRepository.getStats();
  }

  /**
   * Generates a plain text formatted list suitable for sharing or clipboard copying.
   * @returns {Promise<string>}
   */
  async getFormattedShareableList() {
    const tickets = await ticketRepository.findAll();
    const soldTickets = tickets.filter(t => t.buyerName);

    if (soldTickets.length === 0) {
      return 'Sin números vendidos.';
    }

    return soldTickets
      .map(t => {
        let statusLabel = '';
        if (t.status === 'pagado') {
          statusLabel = ' [PAGADO ✅]';
        } else if (t.status === 'abono') {
          statusLabel = ` [ABONÓ $${t.amountPaid.toLocaleString('es-CO')} - Resta $${(TICKET_PRICE - t.amountPaid).toLocaleString('es-CO')}]`;
        } else {
          statusLabel = ' [PENDIENTE ⏳]';
        }
        return `${t.ticketNumber} - ${t.buyerName}${statusLabel}`;
      })
      .join('\n');
  }
}

module.exports = new TicketService();
