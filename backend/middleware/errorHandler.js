function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found - ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
