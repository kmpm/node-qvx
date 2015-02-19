var debug = require('debug')('qvx:buffercursor');
var BufferCursor = require('buffercursor');

module.exports = BufferCursor;

/**
 * adding 64 bit UInt
 */
BufferCursor.prototype.readUInt64LE = function () {
  return [this.readUInt32LE(), this.readUInt32LE()];
};

BufferCursor.prototype.readUInt64BE = function () {
  return [this.readUInt32BE(), this.readUInt32BE()];
};


/**
 * adding 64 bit Int
 */
BufferCursor.prototype.readInt64LE = function () {
  return [this.readInt32LE(), this.readInt32LE()];
};

BufferCursor.prototype.readInt64BE = function () {
  return [this.readInt32BE(), this.readInt32BE()];
};



BufferCursor.prototype.readUInt = function (bytes, endianess) {
  var name = 'readUInt' + (bytes * 8).toString();
  if(bytes > 1) {
    name += endianess;
  }
  debug('readUInt bytes: %s, endianess: %s, name: %s', bytes, endianess, name);
  if (typeof this[name] === 'function') {
    return this[name].call(this);
  }
  else {
    throw new Error('No such method: ' + name);
  }
};


BufferCursor.prototype.readInt = function (bytes, endianess) {

  var name = 'readInt' + (bytes * 8).toString();
  if(bytes > 1) {
    name += endianess;
  }
  debug('readInt bytes: %s, endianess: %s, name: %s', bytes, endianess, name);
  if (typeof this[name] === 'function') {
    return this[name].call(this);
  }
  else {
    throw new Error('No such method: ' + name);
  }
};
