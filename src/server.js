require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db.js');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});