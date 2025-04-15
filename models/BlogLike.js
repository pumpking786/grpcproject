// models/BlogLike.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BlogLike = sequelize.define(
  "BlogLike",
  {
    blogLikeId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    blogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = BlogLike;
