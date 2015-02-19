var debug = require('debug')('qvx:buffercursor');
var BufferCursor = require('buffercursor');
var bignum = require('bignum');

module.exports = BufferCursor;

BufferCursor.prototype.peekByte = function () {
  return this.buffer.readUInt8(this.tell());
};


/**
 * adding 64 bit Int
 */
BufferCursor.prototype.readInt64LE = function () {
  var b = this.slice(8);
  var v = bignum.fromBuffer(b.buffer, {endian: 'little', size: 8});
  if (v.bitLength() < 32) {
    return v.toNumber();
  }
  return v.toString();
};

BufferCursor.prototype.readInt64BE = function () {
  var b = this.slice(8);
  var v = bignum.fromBuffer(b.buffer, {endian: 'big', size: 8});
  if (v.bitLength() < 32) {
    return v.toNumber();
  }
  return v.toString();
};


/**
 * adding 64 bit UInt
 */
BufferCursor.prototype.readUInt64LE = function () {
  return this.readInt64LE();
};

BufferCursor.prototype.readUInt64BE = function () {
  return this.readInt64BE();
};


BufferCursor.prototype.readUInt = function (bytes, endianess) {
  if ([1, 2, 4, 8].indexOf(bytes) === -1) {
    throw new Error('Unsupported number of bytes:' + bytes);
  }
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


BufferCursor.prototype.readBcd = function (length) {
  return this.slice(length).toByteArray();
};
