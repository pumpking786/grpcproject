const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Foreign key should not be null (assuming every blog must have an author)
      references: {
        model: "Users", // References the User table
        key: "id", // References the id field in User
      },
    },
  },
  {
    timestamps: true, // Create createdAt and updatedAt fields
  }
);

module.exports = Blog;
