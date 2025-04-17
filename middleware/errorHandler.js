// middlewares/errorHandler.js
module.exports = function errorHandler(err, req, res, next) {
    console.error('Unhandled error:', err);
  
    res.status(err.statusCode || 500).json({
      message: err.message || 'Internal Server Error',
    //   ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  };
  