// models/index.js
const User = require("./User");
const Blog = require("./Blog");
const BlogLikeDislike = require("./BlogLikeDislike");

// One-to-many: User -> Blog
User.hasMany(Blog, { foreignKey: "userId" });
Blog.belongsTo(User, { foreignKey: "userId" });

// Many-to-many: User <-> Blog through BlogLikeDislike
User.belongsToMany(Blog, {
  through: BlogLikeDislike,
  foreignKey: "userId",
  otherKey: "blogId",
  as: "LikedBlogs", // blogs the user liked
});

User.belongsToMany(Blog, {
  through: BlogLikeDislike,
  foreignKey: "userId",
  otherKey: "blogId",
  as: "DislikedBlogs", // blogs the user disliked
});

Blog.belongsToMany(User, {
  through: BlogLikeDislike,
  foreignKey: "blogId",
  otherKey: "userId",
  as: "LikedByUsers", // users who liked the blog
});

Blog.belongsToMany(User, {
  through: BlogLikeDislike,
  foreignKey: "blogId",
  otherKey: "userId",
  as: "DislikedByUsers", // users who disliked the blog
});

BlogLikeDislike.belongsTo(Blog, {
  foreignKey: "blogId",
});

BlogLikeDislike.belongsTo(User, {
  foreignKey: "userId",
});

module.exports = { User, Blog, BlogLikeDislike };
