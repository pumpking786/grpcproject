const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Make sure to export the Sequelize instance from db.js

const Blog = sequelize.define(
  "Blog",
  {
    blogId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true, // Title is optional
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true, // Content is optional
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true, // Author is optional
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: true, // Likes is optional
      defaultValue: 0, // Default value for likes (0)
    },
    dislikes: {
      type: DataTypes.INTEGER,
      allowNull: true, // Dislikes is optional
      defaultValue: 0, // Default value for dislikes (0)
    },
  },
  {
    // Optional: additional table options (e.g., timestamps)
    timestamps: true, // Create createdAt and updatedAt fields
  }
);

module.exports = Blog;
