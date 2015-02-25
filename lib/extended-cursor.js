/*eslint new-cap: [1, {"capIsNewExceptions": ["QVX_UNSIGNED_INTEGER"]}] */
var debug = require('debug')('qvx:extended-cursor');
var ExtendedCursor = require('buffercursor');
var bignum = require('bignum');

module.exports = ExtendedCursor;


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

ExtendedCursor.prototype.writeString = function (value, length, encoding) {
  return this.write(value, length, encoding);
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
    throw new Error('Bad length for bcd:' + length);
  }
  return this.slice(length);
};

ExtendedCursor.prototype.readDual = function (endian) {
  var flag = this.readUInt8();
  switch (flag) {
    case 0: //QVX_QV_SPECIAL_NUL
      return null;
    case 2: //QVX_QV_SPECIAL_DOUBLE
      debug('QVX_QV_SPECIAL_DOUBLE: %s', endian);
      if (endian === 'big') {
        return {flag: flag, value: this.readDoubleBE()};
      }
      else {
        return {flag: flag, value: this.readDoubleLE()};
      }
      break;
    case 4: //QVX_QV_SPECIAL_STRING
      debug('QVX_QV_SPECIAL_STRING');
      return {flag: flag, value: this.readZeroString()};
    case 6: //QVX_QV_SPECIAL_DOUBLE_AND_STRING
      debug('QVX_QV_SPECIAL_DOUBLE_AND_STRING: %s', endian);
      var v = [
        (endian === 'little' ? this.readDoubleLE() : this.readDoubleBE()),
        this.readZeroString()
      ];
      return {flag: flag, value: v};
    default:
    //QVX_QV_SPECIAL_INT = 1
    //QVX_QV_SPECIAL_INT_AND_STRING = 5
      throw new Error('QvxQvSpecialFlag ' + flag + ' not implemented');
  }

};
