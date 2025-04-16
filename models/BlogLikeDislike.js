// models/BlogLikeDislike.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BlogLikeDislike = sequelize.define(
  "BlogLikeDislike",
  {
    SN: {
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
    like: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // true for like, false for no action
    },
    dislike: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // true for dislike, false for no action
    },
  },
  {
    timestamps: true,
  }
);

module.exports = BlogLikeDislike;
