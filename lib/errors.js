var util = require('util');
function NotImplementedError(message) {

    Error.captureStackTrace(this, NotImplementedError);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;

    this.message = [message, 'is not supported'].join(' ');
}

util.inherits(NotImplementedError, Error);

function EndianError(message) {

    Error.captureStackTrace(this, EndianError);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;

    this.message = ['Endian', message, 'is not allowed'].join(' ');
}

util.inherits(NotImplementedError, Error);



module.exports = {
  NotImplementedError: NotImplementedError
}