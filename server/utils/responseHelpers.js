// utils/responseHelpers.js
// ---------------------------------------------------------
// Standardises all JSON responses across every controller.
// Every API response has the same shape so the React client
// can handle success and error uniformly.
//
// Success shape:  { success: true,  data: {...},   message: "..." }
// Error shape:    { success: false, error: "...",  errors: [...] }
// ---------------------------------------------------------

/**
 * Send a 200 OK success response.
 * @param {Object} res   - Express response object
 * @param {*}      data  - Payload to send (object, array, etc.)
 * @param {string} message - Human-readable success message
 * @param {number} statusCode - HTTP status (default 200)
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response.
 * @param {Object} res      - Express response object
 * @param {string} error    - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {Array}  errors   - Optional array of field-level validation errors
 */
const sendError = (res, error = 'Server error', statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(errors.length > 0 && { errors }), // only include if there are validation errors
  });
};

module.exports = { sendSuccess, sendError };

