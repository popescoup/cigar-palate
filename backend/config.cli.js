/*
	•	Loads environment variables for database configuration using dotenv.
	•	Exports database settings for different environments (development, test, production), though only the development configuration is currently defined.
	•	Defines essential database credentials like username, password, database name, host, and dialect from environment variables.
*/

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
  },
  test: {
    // Test configuration (if needed)
  },
  production: {
    // Production configuration (if needed)
  }
};