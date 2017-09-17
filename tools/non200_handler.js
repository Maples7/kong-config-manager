'use strict';

const logger = require('../utils/logger');

module.exports = function(err, url, method) {
  method = method || 'GET';
  if (err.name === 'StatusCodeError') {
    logger.warning(
      `Request for ${method} - ${url} gets response ${err} but NOT 2xx`
    );
  } else {
    throw err;
  }
};
