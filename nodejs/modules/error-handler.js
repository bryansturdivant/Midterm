// error-handler.js

function handleError(err, req, res, next) {
    console.error('Error:', err);
    
    // Default error
    let status = 500;
    let message = 'Internal server error';
    
    // Handle specific error types
    if (err.code === 'SQLITE_CONSTRAINT') {
      status = 400;
      message = 'Database constraint violation';
    } else if (err.message && err.message.includes('UNIQUE constraint')) {
      status = 409;
      message = 'Resource already exists';
    } else if (err.status) {
      status = err.status;
      message = err.message;
    }
    
    res.status(status).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  function notFound(req, res, next) {
    res.status(404).json({ error: 'Route not found' });
  }
  
  module.exports = {
    handleError: handleError,
    notFound: notFound
  };
  