/*eslint new-cap: [1, {"capIsNewExceptions": ["QVX_UNSIGNED_INTEGER"]}] */
var debug = require('debug')('qvx:qvxcursor');
var QvxCursor = require('buffercursor');
var bignum = require('bignum');

module.exports = QvxCursor;

QvxCursor.prototype.getReader = function (qvxfield) {
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

QvxCursor.prototype.peekByte = function (ahead) {
  ahead = ahead || 0;
  return this.buffer.readUInt8(this.tell() + ahead);
};

/**
 * adding 64 bit Int
 */
QvxCursor.prototype.readInt64LE = function () {
  var b = this.slice(8);
  var v = bignum.fromBuffer(b.buffer, {endian: 'little', size: 8});
  if (v.bitLength() < 32) {
    return v.toNumber();
  }
  return v.toString();
};

QvxCursor.prototype.readInt64BE = function () {
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
QvxCursor.prototype.readUInt64LE = function () {
  return this.readInt64LE();
};


QvxCursor.prototype.readUInt64BE = function () {
  return this.readInt64BE();
};


QvxCursor.prototype.readZeroString = function () {
  var length = 0;
  while (this.peekByte(length) !== 0) {
    length += 1;
  }

  var v = this.toString('utf-8', length);
  this.seek(this.tell() + 1);
  debug('readZeroString', v);
  return v;
};


QvxCursor.prototype.checkNull = function (qvxfield, method) {
  if (qvxfield.NullRepresentation === 'QVX_NULL_FLAG_SUPPRESS_DATA') {
    if(this.readUInt8() === 1) {
      return null;
    }
    else {
      return method();
    }
  }
  else if (qvxfield.NullRepresentation === 'QVX_NULL_NEVER') {
    return method();
  }
  else {
    throw new Error(qvxfield.NullRepresentation + ' is not implemented');
  }
};


QvxCursor.prototype.doName = function (name, qvxfield) {
  if (typeof qvxfield !== 'object') {
    throw new Error('field definition is missing');
  }
  var self = this;
  if (typeof this[name] === 'function') {
    return function (args) {
      debug('at %s, doing "%s" for "%s"', self.tell(), name, qvxfield.FieldName, args);
      return self[name].apply(self, args);
    };
  }
  else {
    throw new Error(name + ' not implemented');
  }
};


QvxCursor.prototype.QVX_IEEE_REAL = function (qvxfield) {
  var big = qvxfield.BigEndian === true ? true : false;
  var bytes = qvxfield.ByteWidth;
  var name = 'read';
  name += bytes === 8 ? 'Double' : 'Float';
  name += big === true ? 'BE' : 'LE';
  return this.doName(name, qvxfield);
};


QvxCursor.prototype.QVX_SIGNED_INTEGER = function (qvxfield) {
  var name = 'readInt' + (qvxfield.ByteWidth * 8).toString();
  if(qvxfield.ByteWidth > 1) {
    name += (qvxfield.BigEndian === true ? 'BE' : 'LE');
  }
  return this.doName(name, qvxfield);
};


QvxCursor.prototype.QVX_UNSIGNED_INTEGER = function (qvxfield) {
  var name = 'readUInt' + (qvxfield.ByteWidth * 8).toString();
  if(qvxfield.ByteWidth > 1) {
    name += (qvxfield.BigEndian === true ? 'BE' : 'LE');
  }
  return this.doName(name, qvxfield);
};


QvxCursor.prototype.QVX_TEXT = function (qvxfield) {
  var self = this;
  var enc = 'utf-8';
  if (qvxfield.CodePage === '1200' || qvxfield.CodePage === '1201') {
    enc = 'utf-16';
  }

  if (qvxfield.Extent === 'QVX_FIX') {
    return function () {
      return self.toString(enc, qvxfield.ByteWidth);
    };
  }
  else if (qvxfield.Extent === 'QVX_COUNTED') {
    var getSize = self.QVX_UNSIGNED_INTEGER(qvxfield);
    return function () {
      var size = getSize();
      debug('reading %s bytes string', size);
      if (typeof size !== 'number') {
        throw new Error('Could not get size');
      }
      return self.toString(enc, size);
    };
  }
  else {
    throw new Error('Extent ' + qvxfield.Extent + ' is not implemented for QVX_TEXT');
  }
};

QvxCursor.prototype.QVX_PACKED_BCD = function (qvxfield) {
  var self = this;
  return function () {
    return self.slice(qvxfield.ByteWidth).toByteArray();
  };
};


QvxCursor.prototype.QVX_QV_DUAL = function (qvxfield) {
  return function (){
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
  }.bind(this);
};
