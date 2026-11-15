const app = require('./app');
const { initDb, pool } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

/**
 * Bootstrap application server and database
 */
async function startServer() {
  try {
    console.log('Connecting to database and verifying schema...');
    await initDb();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Raffle server running at http://localhost:${PORT}`);
      console.log(`🌐 Accessible on local network at http://<your-ip>:${PORT}`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await pool.end();
          console.log('Database pool closed successfully.');
          process.exit(0);
        } catch (err) {
          console.error('Error closing database pool:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start only when executed directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
