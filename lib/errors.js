var util = require('util');
function NotImplementedError(message) {

  Error.captureStackTrace(this, NotImplementedError);
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;

  this.message = [message, 'is not supported'].join(' ');
}

util.inherits(NotImplementedError, Error);

function ExtentError(message) {

  Error.captureStackTrace(this, ExtentError);
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;

  this.message = ['Extent', message, 'is not supported'].join(' ');
}

util.inherits(ExtentError, Error);


module.exports = {
  NotImplementedError: NotImplementedError,
  ExtentError: ExtentError
};
