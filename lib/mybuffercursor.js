var debug = require('debug')('qvx:buffercursor');
var BufferCursor = require('buffercursor');
var bignum = require('bignum');

module.exports = BufferCursor;

BufferCursor.prototype.peekByte = function (ahead) {
  ahead = ahead || 0;
  return this.buffer.readUInt8(this.tell() + ahead);
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

BufferCursor.prototype.readZeroString = function () {
  var length = 0;
  while (this.peekByte(length) !== 0) {
    length += 1;
  }

  var v = this.toString('utf-8', length);
  this.seek(this.tell() + 1);
  debug('readZeroString', v);
  return v;
}

BufferCursor.prototype.readDual = function () {
  var flag = this.readUInt8();
  if (flag === 0) { //QVX_QV_SPECIAL_NULL
    return null;
  }
  else if (flag === 1) { //QVX_QV_SPECIAL_INT
    throw new Error('QvxQvSpecialFlag ' + flag + ' not implemented');
  }
  else if (flag === 2) { //QVX_QV_SPECIAL_DOUBLE
    throw new Error('QvxQvSpecialFlag ' + flag + ' not implemented');
  }
  else if (flag === 4) { //QVX_QV_SPECIAL_STRING
    // throw new Error('QvxQvSpecialFlag ' + flag + ' not implemented');
    return this.readZeroString();
  }
  else if (flag === 5) { //QVX_QV_SPECIAL_INT_AND_STRING
    throw new Error('QvxQvSpecialFlag ' + flag + ' not implemented');
  }
  else if (flag === 6) { //QVX_QV_SPECIAL_DOUBLE_AND_STRING
    //throw new Error('QvxQvSpecialFlag ' + flag + ' not implemented');
    var v = [
      this.readDoubleLE(),
      this.readZeroString()
    ];
    return v;
  }
  else {
    throw new Error('QvxQvSpecialFlag ' + flag + ' not implemented');
  }
}