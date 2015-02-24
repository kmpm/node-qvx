var util = require('util');
var extend = util._extend;
var moment = require('moment');

var debug = require('debug')('qvx:data-types');
var errors = require('./errors');
var qvxconst = require('./qvxconst');


var DATATYPE = function (options, path) {
  this.name = options.name || path;
  this.endian = options.endian || 'little';
  this.bytes = options.bytes;
  this.field = options.field;
  this.extent = options.extent || 'fix';
  this.format = options.format;
  this.whenNull = options.whenNull ||'supress';
  this.encoding = options.encoding || 'utf-8';
};


// DATATYPE.prototype.toString = function () {
//   return this.key;
// };

Object.defineProperty(DATATYPE.prototype, 'wireFormat', {
  get: function () {
    throw new errors.NotImplementedError('wireFormat');
  }
});

DATATYPE.prototype.read = function (cursor) {
  return cursor['read' + this.wireFormat].call(cursor);
};

DATATYPE.prototype.toQvxSpec = function () {
  var obj = {
    FieldName: this.name,
    Type: DATATYPE.interpretAsQvxType(this),
    Extent: qvxconst.extent[this.extent],
    NullRepresentation: qvxconst.nullRepresentation[this.whenNull],
    BigEndian: this.endian === 'big',
    CodePage: DATATYPE.interpretAsQvxCodePage(this),
    ByteWidth: this.bytes
  };

  if (this.format) {
    obj.FieldFormat = {
      Type: this.format.type,
      Fmt: this.format.fmt
    };
  }

  if (typeof this.decimals !== 'unknown') {
    obj.FixPointDecimals = this.decimals;
  }
  return obj;
};


DATATYPE.interpretAsQvxCodePage = function (t) {
  var c = t.encoding.replace('-', '') === 'utf8' ? 65000 : 12000;
  c += (t.endian === 'little' ? 1 : 0);
  return c;
}

DATATYPE.interpretAsQvxType = function (t) {
  if (qvxconst.typeName[t.field]) {
    return qvxconst.typeName[t.field];
  }
  throw new TypeError('No QVX type for `' + t.field + '`');
}



var NumberType = function (path, options) {
  if (!(this instanceof NumberType)) {
    return new NumberType(path, options);
  }

  options = extend({
    extent: 'fix',
    bytes: 8,
    field: 'float'
  }, options);

  options.decimals = options.decimals;
  this.decimals = options.decimals;
  DATATYPE.call(this, options, path);
};

util.inherits(NumberType, DATATYPE);

NumberType.prototype.type = NumberType.type = 'Number';


var DateType = function (path, options) {
  if (!(this instanceof DateType)) {
    return new DateType(path, options);
  }
  options = extend({
    extent: 'counted',
    bytes: 1,
    field: 'text',
    format: {
      type: 'TIMESTAMP',
      fmt: 'YYYY-MM-DD HH:mm:ss'
    }
  }, options);

  DATATYPE.call(this, options, path);
};

util.inherits(DateType, DATATYPE);

DateType.prototype.type = DateType.type = 'Date';


var StringType = function (path, options) {
  if (!(this instanceof StringType)) {
    return new StringType(path, options);
  }
  options = extend({
    extent: 'counted',
    bytes: 4,
    field: 'text'
  }, options);

  DATATYPE.call(this, options, path);
};

util.inherits(StringType, DATATYPE);

StringType.prototype.type = StringType.type = 'String';






module.exports = {
  Number: NumberType,
  Date: DateType,
  String: StringType
}
// var NUMBER = function(options) {
//   this.options = options || {};
//   this._length = options.length;
//   this._zerofill = options.zerofill;
//   this._decimals = options.decimals;
//   this._precision = options.precision;
//   this._scale = options.scale;
//   this._unsigned = options.unsigned;
//   this._bigEndian = options.bigEndian;
//   this._bcd = options.bcd === true;
//   if (!this._bcd && [undefined, 1, 2, 4, 8].indexOf(this._length) === -1) {
//     throw new Error(['Bad Length.', this._length, 'is not allowed number of bits'].join(' '));
//   }
// };

// util.inherits(NUMBER, DATATYPE);

// NUMBER.prototype.key = NUMBER.key = 'NUMBER';

// Object.defineProperty(NUMBER.prototype, 'UNSIGNED', {
//   get: function () {
//     this._unsigned = true;
//     this.options.unsigned = true;
//     return this;
//   }
// });


// NUMBER.prototype.DECIMALS = function (decimals) {
//   if (isNaN(decimals)) {
//     throw new TypeError('decimals is not a number');
//   }
//   this._decimals = decimals;
//   this.options.decimals = decimals;
//   return this;
// };


// NUMBER.prototype.read = function (cursor) {
//   var mName = 'read' + this.wireFormat;
//   if (typeof cursor[mName] !== 'function') {
//     throw new errors.NotImplementedError('wireFormat: ' + mName);
//   }
//   return cursor[mName].call(cursor);
// };


// NUMBER.prototype.toQvxSpec = function () {
//   var spec = {
//     Type: '',
//     Extent: ''
//   };
//   if (!this._unsigned) {
//     spec.Type = 'QVX_SIGNED_INTEGER';
//   }
//   if (this._bcd) {
//     spec.Type = 'QVX_PACKED_BCD';
//   }
//   spec.Extent = 'QVX_FIX';

//   if (typeof this._decimals !== 'undefined') {
//     spec.FixPointDecimals = this._decimals;
//   }
//   spec.ByteWidth = this._length;
//   return spec;
// };


// NUMBER.prototype.write = function (cursor, value) {
//   var mName = 'write' + this.wireFormat;
//   cursor[mName](value);
// };


// /*
//  * Up to 32 bit integer
//  *
//  */

// var INTEGER = function(length, bigEndian) {
//   var options = typeof length === 'object' && length || {
//     length: length,
//     bigEndian: bigEndian === true
//   };
//   if (!(this instanceof INTEGER)) { return new INTEGER(options); }
//   NUMBER.call(this, options);
// };

// util.inherits(INTEGER, NUMBER);

// INTEGER.prototype.key = INTEGER.key = 'INTEGER';

// Object.defineProperty(INTEGER.prototype, 'wireFormat', {
//   get: function () {
//     var bits = this.options.length * 8;
//     return (this.options.unsigned ? 'U' : '') + 'Int' + bits +
//       (bits > 8 ? (this._bigEndian ? 'BE' : 'LE') : '');
//   }
// });


// var BIGINT = function(bigEndian) {
//   var options = typeof bigEndian === 'object' && bigEndian || {
//     length: 8,
//     bigEndian: bigEndian === true
//   };
//   if (!(this instanceof BIGINT)) { return new BIGINT(options); }
//   NUMBER.call(this, options);
// };

// util.inherits(BIGINT, NUMBER);

// BIGINT.prototype.key = BIGINT.key = 'BIGINT';

// Object.defineProperty(BIGINT.prototype, 'wireFormat', {
//   get: function () {
//     return 'Int64' + (this._bigEndian ? 'BE' : 'LE');
//   }
// });


// var FLOAT = function(length, bigEndian, decimals) {
//   var options = typeof length === 'object' && length || {
//     length: length,
//     bigEndian: bigEndian === true,
//     decimals: decimals
//   };
//   if (!(this instanceof FLOAT)) { return new FLOAT(options); }
//   NUMBER.call(this, options);
// };
// util.inherits(FLOAT, NUMBER);

// FLOAT.prototype.key = FLOAT.key = 'FLOAT';


// Object.defineProperty(FLOAT.prototype, 'wireFormat', {
//   get: function () {
//     return (this._length === 8 ? 'Double' : 'Float') + (this._bigEndian ? 'BE' : 'LE');
//   }
// });

// FLOAT.prototype.toQvxSpec = function () {
//   var spec = NUMBER.prototype.toQvxSpec.call(this);
//   spec.Type = 'QVX_IEEE_REAL';
//   return spec;
// };


// var BCD = function(length, bigEndian) {
//   var options = typeof length === 'object' && length || {
//     length: length,
//     bigEndian: bigEndian === true,
//     bcd: true
//   };
//   if (!(this instanceof BCD)) { return new BCD(options); }
//   options.bcd = true;
//   NUMBER.call(this, options);
// };

// util.inherits(BCD, NUMBER);

// BCD.prototype.key = BCD.key = 'BCD';

// Object.defineProperty(BCD.prototype, 'wireFormat', {
//   get: function () {
//     return 'Bcd';
//   }
// });

// BCD.prototype.read = function (cursor) {
//   return cursor.readBcd(this._length);
// };


// /*
//  * String
//  * - If 0 length then it's a null terminated string.
//  * - If not counted then it's 'length' number of chars
//  * - If counted then length is the number of bytes in the UInt that
//  *   defines the size of the string.
//  */
// var TEXT = function (options) {
//   options.extent = options.extent || 'counted';
//   // this.options = options;
//   this._encoding = options.encoding || 'utf-8';
//   this._length = options.length;
//   this._bigEndian = options.bigEndian;
//   this._extent = options.extent;

//   if (this._length === undefined) {
//     throw new TypeError('length must be defined');
//   }
// };

// util.inherits(TEXT, DATATYPE);

// TEXT.prototype.key = TEXT.key = 'TEXT';

// Object.defineProperty(TEXT.prototype, 'wireFormat', {
//   get: function () {
//     return this._extent === 'terminated' ? 'ZeroString' : 'String';
//   }
// });

// TEXT.prototype.toQvxSpec = function () {
//   return {
//     Type: 'QVX_TEXT',
//     Extent: (this._extent === 'counted' ? 'QVX_COUNTED' :
//       (this._extent === 'terminated' ? 'QVX_ZERO_TERMINATED' : 'QVX_FIX')),
//     BigEndian: this._bigEndian,
//     CodePage: this._encoding === 'utf-8' ? 65001 : 12001,
//     ByteWidth: this._length
//   };
// };

// TEXT.prototype.read = function (cursor) {
//   var mName = 'read' + this.wireFormat;
//   if (typeof cursor[mName] !== 'function') {
//     throw new errors.NotImplementedError('wireFormat: ' + mName);
//   }
//   var textLength;
//   if (this._extent === 'fix') {
//     textLength = this._length;
//   }
//   else if (this._extent === 'terminated') {
//     textLength = 0;
//   }
//   else if (this._extent === 'counted') {
//     var countedType = INTEGER(this._length, this._bigEndian).UNSIGNED;
//     textLength = countedType.read(cursor);
//   }
//   else {
//     throw new errors.ExtentError(this._extent);
//   }
//   debug('TEXT:read, mName=%s, length=%s, textLength=%s', mName, this._length, textLength);
//   return cursor[mName].call(cursor, this._encoding, textLength);
// };


// TEXT.prototype.write = function (cursor, value) {
//   debug('TEXT#write "%s" using %s(%j)', value, this.key, this);
//   if (this._extent === 'counted') {
//     var countedType = INTEGER(this._length, this._bigEndian).UNSIGNED;
//     countedType.write(cursor, value.length);
//     cursor.write(value, value.length, value._encoding);
//   }
//   else if (this._extent === 'fix') {
//     if (value.length > this._length) {
//       throw new Error('value is to big');
//     }
//     cursor.write(value, value.length, value._encoding);
//     if ((value.length - this._length) > 0) {
//       cursor.fill(0, value.length - this._length);
//     }
//   }
//   else {
//     throw new Error('support extent ' + this._extent);
//   }
// };

// var STRING = function (encoding, length, bigEndian, extent) {
//   var options = typeof encoding === 'object' && encoding || {
//     encoding: encoding || 'utf-8',
//     length: length,
//     bigEndian: bigEndian === true,
//     extent: extent || 'counted'
//   };
//   if (!(this instanceof STRING)) { return new STRING(options); }
//   TEXT.call(this, options);
// };

// util.inherits(STRING, TEXT);

// STRING.prototype.key = STRING.key = 'STRING';


// var TIMESTAMP = function(encoding, length, bigEndian, extent, format) {
//   var options = typeof encoding === 'object' && encoding || {
//     length: length || 1,
//     encoding: encoding,
//     bigEndian: bigEndian === true,
//     extent: extent,
//     format: format || 'YYYY-MM-DD HH:mm:ss.fff'
//   };
//   if (!(this instanceof TIMESTAMP)) { return new TIMESTAMP(options); }
//   this._format = options.format;
//   TEXT.call(this, options);
// };
// util.inherits(TIMESTAMP, TEXT);

// TIMESTAMP.prototype.key = TIMESTAMP.key = 'TIMESTAMP';


// TIMESTAMP.prototype.toQvxSpec = function () {
//   var spec = TEXT.prototype.toQvxSpec.call(this);
//   spec.FieldFormat = {
//     Type: 'TIMESTAMP',
//     Fmt: this._format.replace('HH', 'hh')
//   };
//   return spec;
// };

// TIMESTAMP.prototype.read = function (cursor) {
//   var s = TEXT.prototype.read.call(this, cursor);
//   return moment(s, this._format.replace('.fff', '')).toDate();
// };


// TIMESTAMP.prototype.write = function (cursor, value) {
//   value = moment(value).format(this._format.replace('.fff', ''));
//   TEXT.prototype.write.call(this, cursor, value);
// };


// var DUAL = function(decimals) {
//   var options = typeof decimals === 'object' && decimals || {
//     decimals: decimals
//   };
//   if (!(this instanceof DUAL)) { return new DUAL(options); }
//   this.options = options;
//   this._decimals = options.decimals;
// };

// util.inherits(DUAL, DATATYPE);

// DUAL.prototype.key = DUAL.key = 'DUAL';

// Object.defineProperty(DUAL.prototype, 'wireFormat', {
//   get: function () {
//     return 'Dual';
//   }
// });


// DUAL.prototype.DECIMALS = function (decimals) {
//   if (isNaN(decimals)) {
//     throw new TypeError('decimals is not a number');
//   }
//   this._decimals = decimals;
//   this.options.decimals = decimals;
// };


// module.exports = {
//   BIGINT: BIGINT,
//   DUAL: DUAL,
//   FLOAT: FLOAT,
//   INTEGER: INTEGER,
//   STRING: STRING,
//   TIMESTAMP: TIMESTAMP,
//   BCD: BCD
// };
