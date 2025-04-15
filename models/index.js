// models/index.js
const User = require("./User");
const Blog = require("./Blog");
const BlogLike = require("./BlogLike");

// Define the one-to-many relationship
User.hasMany(Blog, { foreignKey: "userId" });
Blog.belongsTo(User, { foreignKey: "userId" });

// Liked Blogs
User.belongsToMany(Blog, {
  through: BlogLike,
  foreignKey: "userId",
  as: "LikedBlogs",
});
Blog.belongsToMany(User, {
  through: BlogLike,
  foreignKey: "blogId",
  as: "LikedByUsers",
});

module.exports = { User, Blog };
