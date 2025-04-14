const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Make sure to export the Sequelize instance from db.js

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensure the username is unique
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    // Optional: table options (timestamps, etc.)
    timestamps: true,
  }
);

module.exports = User;
