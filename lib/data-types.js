var util = require('util');
var errors = require('./errors');
var debug = require('debug')('qvx:data-types');


var DATATYPE = function (options) {

}

DATATYPE.prototype.toString = function () {
  return this.key;
}

Object.defineProperty(DATATYPE.prototype, 'wireFormat', {
  get: function () {
    throw new errors.NotImplementedError('wireFormat');
  }
});

DATATYPE.prototype.read = function (cursor) {
  return cursor['read' + this.wireFormat].call(cursor);
}


var NUMBER = function(options) {
  this.options = options || {};
  this._length = options.length;
  this._zerofill = options.zerofill;
  this._decimals = options.decimals;
  this._precision = options.precision;
  this._scale = options.scale;
  this._unsigned = options.unsigned;
  this._bidEndian = options.bigEndian;
  this._bcd = options.bcd;
  if ([undefined, 1, 2, 4, 8].indexOf(this._length) === -1) {
    throw new Error(['Bad Length.', this._length, 'is not allowed number of bits'].join(' '));
  }
};

util.inherits(NUMBER, DATATYPE);

NUMBER.prototype.key = NUMBER.key = 'NUMBER';

Object.defineProperty(NUMBER.prototype, 'UNSIGNED', {
  get: function () {
    this._unsigned = true;
    this.options.unsigned = true;
    return this;
  }
});

Object.defineProperty(NUMBER.prototype, 'BE', {
  get: function () {
    this._bigEndian = true;
    this.options.bigEndian = true;
    return this;
  }
});

NUMBER.prototype.read = function (cursor) {
  var mName = 'read' + this.wireFormat;
  if (typeof cursor[mName] !== 'function') {
    throw new errors.NotImplementedError('wireFormat: ' + mName);
  }
  return cursor[mName].call(cursor);
}

/*
 * Up to 32 bit integer
 *
 */

var INTEGER = function(length, bigEndian) {
  var options = typeof length === "object" && length || {
    length: length,
    bigEndian: bigEndian === true
  };
  if (!(this instanceof INTEGER)) return new INTEGER(options);
  NUMBER.call(this, options);
};

util.inherits(INTEGER, NUMBER);

INTEGER.prototype.key = INTEGER.key = 'INTEGER';

Object.defineProperty(INTEGER.prototype, 'wireFormat', {
  get: function () {
    var bits = this.options.length * 8;
    return (this.options.unsigned ? 'U': '') + 'Int' + bits +
      (bits > 8 ?
              (this._bigEndian ? 'BE' : 'LE') :
              '');
  }
});



var BIGINT = function(bigEndian) {
  var options = typeof bigEndian === "object" && bigEndian || {
    length: 8,
    bigEndian: bigEndian === true
  };
  if (!(this instanceof BIGINT)) return new BIGINT(options);
  NUMBER.call(this, options);
};

util.inherits(BIGINT, NUMBER);

BIGINT.prototype.key = BIGINT.key = 'BIGINT';

Object.defineProperty(BIGINT.prototype, 'wireFormat' , {
  get: function () {
    return 'Int64' + (this._bigEndian ? 'BE' : 'LE');
  }
});




var FLOAT = function(length, bigEndian, decimals) {
  var options = typeof length === "object" && length || {
    length: length,
    bigEndian: bigEndian === true,
    decimals: decimals
  };
  if (!(this instanceof FLOAT)) return new FLOAT(options);
  NUMBER.call(this, options);
};
util.inherits(FLOAT, NUMBER);

FLOAT.prototype.key = FLOAT.key = 'FLOAT';


Object.defineProperty(FLOAT.prototype, 'wireFormat' , {
  get: function () {
    return (this._length === 8 ? 'Double' : 'Float') + (this._bigEndian ? 'BE' : 'LE');
  }
});



var BCD = function() {
  var options = {
    bcd: true
  }
  if (!(this instanceof BCD)) return new BCD(options);
  NUMBER.call(this, options);
};

util.inherits(BCD, NUMBER);

BCD.prototype.key = BCD.key = 'BCD';

Object.defineProperty(BCD.prototype, 'wireFormat', {
  get: function () {
    return 'Bcd';
  }
});

BCD.prototype.read = function (cursor) {
  return cursor.readBcd(this._length);
};


/*
 * String
 * - If 0 length then it's a null terminated string.
 * - If not counted then it's "length" number of chars
 * - If counted then length is the number of bytes in the UInt that
 *   defines the size of the string.
 */
var STRING = function(encoding, length, countedEndian) {
  var options = typeof encoding === "object" && encoding || {
    encoding: encoding || 'utf-8',
    length: length,
    countedEndian: countedEndian
  };
  if (!(this instanceof STRING)) return new STRING(options);
  this.options = options;
  this._encoding = options.encoding;
  this._countedEndian = options.countedEndian;
  this._length = options.length || 0;


  this.counted = function (endian) {
    if (endian !== 'BE' && endian !== 'LE') {
      throw new errors.EndianError(endian);
    }
    debug('setting counted', endian);
    this._sizeType = INTEGER(this._length, this._countedEndian === 'BE').UNSIGNED;
  };

  if (this._countedEndian) {
    this.counted(this._countedEndian);
  }
};

util.inherits(STRING, DATATYPE);

STRING.prototype.key = STRING.key = 'STRING';



Object.defineProperty(STRING.prototype, 'wireFormat' , {
  get: function () {
    return this.length === 0 ? 'ZeroString' : 'String';
  }
});


STRING.prototype.read = function (cursor) {
  var mName = 'read' + this.wireFormat;
  if (typeof cursor[mName] !== 'function') {
    throw new errors.NotImplementedError('wireFormat: ' + mName);
  }
  var size = this._length;
  debug('typeof sizeType', typeof this._sizeType);
  if (typeof this._sizeType !== 'undefined') {
    debug('sizeType=%s', this._sizeType.key);
    size = this._sizeType.read(cursor);
  }
  debug('STRING:read, mName=%s, length=%s, size=%s', mName, this._length, size)
  return cursor[mName].call(cursor, this._encoding, size);
}



var TIMESTAMP = function(encoding, length, countedEndian, format) {
    var options = typeof encoding === "object" && encoding || {
      length: length,
      encoding: encoding,
      format: format,
      countedEndian: countedEndian,
      format: format || 'YYYY-MM-DD hh:mm:ss.fff'
  };
   if (!(this instanceof TIMESTAMP)) return new TIMESTAMP(options);
   this._format = options.format;
  STRING.call(this, options);
};
util.inherits(TIMESTAMP, STRING);

TIMESTAMP.prototype.key = TIMESTAMP.key = 'TIMESTAMP';

Object.defineProperty(TIMESTAMP.prototype, 'wireFormat' , {
  get: function () {
    return 'Date'
  }
});


var DUAL = function(options) {
  if (!(this instanceof DUAL)) return new DUAL(options);
  this.options = options;
};

util.inherits(DUAL, DATATYPE);

DUAL.prototype.key = DUAL.key = 'DUAL';

Object.defineProperty(DUAL.prototype, 'wireFormat' , {
  get: function () {
    return 'Dual'
  }
});




module.exports = {
  BIGINT: BIGINT,
  DUAL: DUAL,
  FLOAT: FLOAT,
  INTEGER: INTEGER,
  STRING: STRING,
  TIMESTAMP: TIMESTAMP,
  BCD: BCD
};
