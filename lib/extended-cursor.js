/*eslint new-cap: [1, {"capIsNewExceptions": ["QVX_UNSIGNED_INTEGER", "Array"]}] */
var debug = require('debug')('qvx:extended-cursor');
var ExtendedCursor = require('buffercursor');
var bignum = require('bignum');

module.exports = ExtendedCursor;

var QvxQvSpecialFlag = require('./qvxconst').QvxQvSpecialFlag;

// var internal = {
//   isDecimalN: function (v) {
//     if (typeof v === 'string') {
//       v = parseFloat(v);
//     }
//     return (v % 1 !== 0);
//   }
// };


ExtendedCursor.prototype.push = function (buf) {
  return new ExtendedCursor(
    Buffer.concat([this.buffer.slice(this.tell()), buf]));
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
  return v;
};

ExtendedCursor.prototype.readInt64BE = function () {
  var b = this.slice(8);
  var v = bignum.fromBuffer(b.buffer, {endian: 'big', size: 8});
  if (v.bitLength() < 32) {
    return v.toNumber();
  }
  return v;
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
// ExtendedCursor.prototype.readUInt64LE = function () {
//   return this.readInt64LE();
// };


// ExtendedCursor.prototype.readUInt64BE = function () {
//   return this.readInt64BE();
// };


ExtendedCursor.prototype.readString = function (encoding, length) {
  debug('readString("%s", %s)', encoding, length);
  return this.toString(encoding, length);
};

ExtendedCursor.prototype.writeString = function (value, length, encoding) {
  return this.write(value, length, encoding);
};

ExtendedCursor.prototype.readZeroString = function (encoding) {
  encoding = encoding || 'utf-8';
  var length = 0;
  while (this.peekByte(length) !== 0) {
    length += 1;
  }

  var v = this.toString('utf-8', length);
  this.seek(this.tell() + 1);
  debug('readZeroString', v);
  return v;
};

ExtendedCursor.prototype.writeZeroString = function (value, length, encoding) {
  this.writeString(value, value.length, encoding);
  return this.writeUInt8(0);
};

// ExtendedCursor.prototype.readDate = function (encoding, length) {
//   debug('readDate(%s, %s)', encoding, length);
//   var s = this.readString(encoding, length);
//   debug('readDate, string=', s);
//   return new Date(s);
// }


ExtendedCursor.prototype.readBcd = function (length, decimals) {
  decimals = decimals || 0;
  debug('readBcd(%s)', length);
  if (!length || length < 1 || length > (this.length - this.tell())) {
    throw new Error('Bad length for bcd:' + length);
  }
  var cur = this.slice(length);
  var s = '';
  while(!cur.eof()) {
    s += cur.readUInt8().toString();
  }
  var f = parseFloat(s);
  if(decimals !== 0 ) {
    f = f / Math.pow(10, decimals);
  }
  return f;
};

ExtendedCursor.prototype.writeBcd = function (value, length, decimals) {
  decimals = decimals || 0;
  debug('writeBcd(%s)', length);
  value = Array(length).join('0') + value.toString();
  value = value.substr(length * -1);

  for (var i = 0; i < value.length; i++) {
    this.writeUInt8(parseInt(value[i]));
  }
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


ExtendedCursor.prototype.writeDual = function (field, value) {
  if (!field || field.type !== 'Dual') {
    throw new TypeError('Field is not a Dual');
  }
  if (typeof value === 'undefined') {
    throw new TypeError('No value to write');
  }
  if (value === null) {
    return this.writeUInt8(QvxQvSpecialFlag.QVX_QV_SPECIAL_NUL);
  }
  if (!isNaN(value)) {
    //TODO: Check if integer and possibly do that.
    if (typeof value === 'string') {
      this.writeUInt8(QvxQvSpecialFlag.QVX_QV_SPECIAL_DOUBLE_AND_STRING);
      if (field.endian === 'big') {
        this.writeDoubleBE(value);
      } else {
        this.writeDoubleLE(value);
      }

      return this.writeZeroString(value, value.length, field.encoding);
    }
    else {
      this.writeUInt8(QvxQvSpecialFlag.QVX_QV_SPECIAL_DOUBLE);
      return (field.endian === 'big' ? this.writeDoubleBE(value) : this.writeDoubleLE(value));
    }
  }
  else {
    value = value.toString();
    this.writeUInt8(QvxQvSpecialFlag.QVX_QV_SPECIAL_STRING);
    return this.writeZeroString(value, value.length, field.encoding);
  }
};
