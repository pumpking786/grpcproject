// models/index.js
const User = require("./User");
const Blog = require("./Blog");

// Define the one-to-many relationship
User.hasMany(Blog, { foreignKey: "userId" });
Blog.belongsTo(User, { foreignKey: "userId" });

module.exports = { User, Blog };
