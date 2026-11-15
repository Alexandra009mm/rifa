/**
 * Vercel Serverless Function entry point
 * Bridges Express app with Vercel serverless execution environment
 */
const app = require('../src/app');
const { initDb } = require('../src/config/db');

let isInitialized = false;

module.exports = async (req, res) => {
  // Ensure database schema and initial data are initialized once per cold start
  if (!isInitialized) {
    try {
      await initDb();
      isInitialized = true;
    } catch (err) {
      console.warn('Vercel serverless DB initialization warning:', err.message);
      // Proceed so route handlers can output proper diagnostic JSON if DB is not reachable
    }
  }

  return app(req, res);
};
