/*eslint new-cap: [1, {"capIsNewExceptions": ["QVX_UNSIGNED_INTEGER"]}] */
var debug = require('debug')('qvx:extended-cursor');
var ExtendedCursor = require('buffercursor');
var bignum = require('bignum');

module.exports = ExtendedCursor;

ExtendedCursor.prototype.getReader = function (qvxfield) {
  var self = this;
  if (typeof this[qvxfield.Type] !== 'function') {
    throw new Error(qvxfield.Type + ' is not implemented');
  }
  var m = this[qvxfield.Type](qvxfield);
  debug('getting cursor reader for "%s"', qvxfield.FieldName);
  return function () {
    return self.checkNull(qvxfield, m);
  };
};


ExtendedCursor.prototype.peekByte = function (ahead) {
  ahead = ahead || 0;
  return this.buffer.readUInt8(this.tell() + ahead);
};


/**
 * adding 64 bit Int
 */
ExtendedCursor.prototype.readInt64LE = function () {
  var b = this.slice(8);
  var v = bignum.fromBuffer(b.buffer, {endian: 'little', size: 8});
  if (v.bitLength() < 32) {
    return v.toNumber();
  }
  return v.toString();
};

ExtendedCursor.prototype.readInt64BE = function () {
  var b = this.slice(8);
  var v = bignum.fromBuffer(b.buffer, {endian: 'big', size: 8});
  if (v.bitLength() < 32) {
    return v.toNumber();
  }
  return v.toString();
};

ExtendedCursor.prototype.writeInt64LE = function (value) {
  if (!(value instanceof bignum)) {
    value = bignum(value);
  }
  var buf = value.toBuffer({
    endian: 'little',
    size: 8
  });

  this.copy(buf);
  return this;
};


/**
 * adding 64 bit UInt
 */
ExtendedCursor.prototype.readUInt64LE = function () {
  return this.readInt64LE();
};


ExtendedCursor.prototype.readUInt64BE = function () {
  return this.readInt64BE();
};


ExtendedCursor.prototype.readString = function (encoding, length) {
  debug('readString("%s", %s)', encoding, length);
  return this.toString(encoding, length);
};


ExtendedCursor.prototype.readZeroString = function () {
  var length = 0;
  while (this.peekByte(length) !== 0) {
    length += 1;
  }

  var v = this.toString('utf-8', length);
  this.seek(this.tell() + 1);
  debug('readZeroString', v);
  return v;
};

// ExtendedCursor.prototype.readDate = function (encoding, length) {
//   debug('readDate(%s, %s)', encoding, length);
//   var s = this.readString(encoding, length);
//   debug('readDate, string=', s);
//   return new Date(s);
// }

ExtendedCursor.prototype.readBcd = function (length) {
  debug('readBcd(%s)', length);
  if (!length || length < 1 || length > (this.length - this.tell())) {
    throw new Error('Band length' );
  }
  return this.slice(length);
};

ExtendedCursor.prototype.readDual = function () {
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
};
