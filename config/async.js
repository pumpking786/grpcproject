const sequelize = require("../config/db");
const User = require("../models/User"); // import all models before sync
const Blog = require("../models/Blog"); // import all models before sync
const BlogLike = require("../models/BlogLike");
const connectAndSync = async () => {
  try {
    // Authenticate the connection
    await sequelize.authenticate();
    console.log("✅ Connected to DB.");

    await sequelize.sync({ alter: true });
    // await sequelize.drop();
    // console.log("✅ All tables dropped.");
  } catch (error) {
    console.error("❌ Failed to connect or drop tables:", error);
  }
};

connectAndSync();
