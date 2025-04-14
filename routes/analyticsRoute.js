const express = require("express");
const { Blog, User } = require("../models"); // Import Sequelize models

const analyticsRoutes = () => {
  const router = express.Router();

  // Analytics endpoint (public)
  router.get("/", async (req, res) => {
    try {
      const userCount = await User.count();
      const blogCount = await Blog.count();

      console.log("Analytics fetched:", { userCount, blogCount }); // Debug log

      res.json({
        totalUsers: userCount,
        totalBlogs: blogCount,
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({
        error: "Failed to fetch analytics data",
      });
    }
  });

  return router;
};

module.exports = analyticsRoutes;
