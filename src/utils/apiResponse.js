class ApiResponse {
  static success(res, statusCode = 200, message = 'Success', data = null, meta = null) {
    const response = {
      success: true,
      message,
      data,
    };
    if (meta) {
      response.meta = meta;
    }
    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;