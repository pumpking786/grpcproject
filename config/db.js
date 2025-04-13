const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('grpctask', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
});

const connectAndSync = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB.');
  } catch (error) {
    console.error('❌ Failed to connect or sync:', error);
  }
};

connectAndSync();

module.exports = sequelize;
