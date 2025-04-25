const express = require('express');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth'); // Import auth routes
const blogRoutes = require('./routes/blog'); // Import blog routes

const app = express();
app.use(express.json());

// Use the routes
app.use('/auth', authRoutes); // Prefix auth routes with /auth
app.use('/blog', blogRoutes); // Prefix blog routes with /blog

app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`REST API running at http://localhost:${PORT}`);
});
