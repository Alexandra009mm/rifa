const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Aggregate and helper routes
router.get('/stats', ticketController.getStats);
router.get('/export', ticketController.getExport);
router.post('/reset', ticketController.resetAll);

// Collection routes
router.get('/', ticketController.getAll);

// Individual ticket routes
router.get('/:number', ticketController.getOne);
router.put('/:number', ticketController.update);
router.delete('/:number', ticketController.release);
router.post('/:number/release', ticketController.release);

module.exports = router;
