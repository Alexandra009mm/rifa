const ticketService = require('../services/ticketService');

/**
 * Controller handling HTTP requests for tickets
 */
class TicketController {
  async getAll(req, res, next) {
    try {
      const { query, status } = req.query;
      const tickets = await ticketService.listTickets({ query, status });
      res.json({ success: true, data: tickets });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const { number } = req.params;
      const ticket = await ticketService.getTicket(number);
      res.json({ success: true, data: ticket });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { number } = req.params;
      const updated = await ticketService.updateTicket(number, req.body);
      res.json({ success: true, message: 'Ticket updated successfully', data: updated });
    } catch (error) {
      next(error);
    }
  }

  async release(req, res, next) {
    try {
      const { number } = req.params;
      const released = await ticketService.releaseTicket(number);
      res.json({ success: true, message: 'Ticket released successfully', data: released });
    } catch (error) {
      next(error);
    }
  }

  async resetAll(req, res, next) {
    try {
      const { confirmation } = req.body;
      const result = await ticketService.resetAllTickets(confirmation);
      res.json({ success: true, message: `Successfully reset ${result.count} tickets` });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await ticketService.getStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getExport(req, res, next) {
    try {
      const formatted = await ticketService.getFormattedShareableList();
      res.json({ success: true, data: formatted });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TicketController();
