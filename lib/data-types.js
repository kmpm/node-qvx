var util = require('util');
var extend = util._extend;
var moment = require('moment');
var misc = require('./misc');
var assert = require('assert');

var debug = require('debug')('qvx:data-types');
var debugErr = require('debug')('qvx:error');
// var errors = require('./errors');
var qvxconst = require('./qvxconst');


var fieldToWire = {
  float: 'float',
  text: 'String',
  signed: 'Int',
  unsigned: 'UInt',
  bcd: 'Bcd',
  dual: 'Dual'
};

var floatToWire = {
  '4': 'Float',
  '8': 'Double'
};

var DATATYPE = function (options, name) {
  // this.type = this.key
  this.name = name;
  this.endian = options.endian || 'little';
  this.bytes = options.bytes;
  this.field = options.field;
  this.extent = options.extent || 'fix';
  this.format = options.format;
  this.whenNull = options.whenNull || 'supress';
  this.encoding = options.encoding || 'utf-8';
  this.decimals = typeof options.decimals !== 'undefined' ? parseInt(options.decimals) : undefined;
};


DATATYPE.prototype.toJSON = function () {
  var tmp = extend({type: this.type}, this);
  return tmp;
};


Object.defineProperty(DATATYPE.prototype, 'wireFormat', {
  get: function () {
    var wire = fieldToWire[this.field];
    if (wire === 'float') {
      wire = floatToWire[this.bytes];
      wire += (this.endian === 'little' ? 'LE' : 'BE');
    }
    else if (wire === 'Int' || wire === 'UInt') {
      wire += (this.bytes * 8).toString();
      if (this.bytes > 1) {
        wire += (this.endian === 'little' ? 'LE' : 'BE');
      }
    }
    // else if (wire === 'String') {
    //   wire = this.type;
    // }
    return wire;
  }
});


DATATYPE.prototype.read = function (cursor) {
  debug('DATATYPE#read');
  var start = cursor.tell();
  var wf = this.wireFormat;
  var args;
  var mName = 'read' + wf;
  if (typeof cursor[mName] !== 'function') {
    // debug('error in read: %j', this);
    throw new Error( mName + ' does not exist in cursor');
  }

  if (wf === 'String') {
    args = [this.encoding];
    if (this.extent === 'counted') {
      var countedType = new NumberType('counted', {type: 'Number',
        bytes: this.bytes, endian: this.endian, field: 'unsigned'});
      args.push(countedType.read(cursor));
//     textLength = countedType.read(cursor);
    }
    else if (this.extent === 'fix') {
      args.push(this.bytes);
    }
    else {
      if (this.extent !== 'zero') {
        throw new TypeError('Extent `' + this.extent + '` is not allowed for strings');
      }
      mName = 'readZeroString';
    }
  }
  else if (wf === 'Bcd') {
    args = [this.bytes, this.decimals];
  }
  else if (wf === 'Dual') {
    args = [this.endian];
  }
  try {
    var v = cursor[mName].apply(cursor, args);
    debug('%d %s(%s/%s)>', start, this.name, wf, this.type, v);
  }
  catch(err) {
    debugErr('%d %s(%s/%s)>ERROR at %s/%s', start, this.name, wf, this.type, cursor.tell(), cursor.length);
    throw err;
  }
  return v;
};


DATATYPE.prototype.write = function (cursor, value) {
  var wf = this.wireFormat;
  var mName = 'write' + wf;
  if (typeof cursor[mName] !== 'function') {
    debug('error in write: %j', this);
    throw new Error( mName + ' does not exist in cursor');
  }
  debug('write %s', mName);
  if (wf === 'String') {
    if (typeof value === 'object') {
      if (this instanceof DateType) {
        value = moment(value).format(this.format.fmt);
      }
      else {
        value = value.toString();
      }
    }
    if (this.extent === 'counted') {
      var countedType = new NumberType('counted', {type: 'Number',
        bytes: this.bytes, endian: this.endian, field: 'unsigned'});
      countedType.write(cursor, value.length);
      debug('wrote counted size of %s', value.length);
      return cursor.writeString(value, value.length, this.encoding);

    }
    else if (this.extent === 'fix') {
      if (value.length > this.bytes) {
        throw new Error('value is to big');
      }
      debug('fix size: %s, length: %s', this.bytes, value.length);
      var rc = cursor.write(value, value.length, this.encoding);
      if ((value.length - this.bytes) > 0) {
        debug('fill %d', value.length - this.bytes);
        rc = cursor.fill(0, value.length - this.bytes);
      }
      debug('written fix');
      return rc;
    }
    else {
      return cursor.writeZeroString(value, value.length, this.encoding);
    }
  }
  else if (wf === 'Dual') {
    return cursor[mName](this, value);

  }

  return cursor[mName](value);
};


DATATYPE.prototype.toQvxSpec = function () {
  var obj = {
    FieldName: this.name,
    Type: interpretAsQvxType(this),
    Extent: qvxconst.extentToQvx[this.extent],
    NullRepresentation: qvxconst.nullRepresentation[this.whenNull],
    BigEndian: this.endian === 'big',
    CodePage: DATATYPE.interpretAsQvxCodePage(this),
    ByteWidth: this.bytes
  };

  if (this.format) {
    obj.FieldFormat = {};
    if (typeof this.format.type !== 'undefined') { obj.FieldFormat.Type = this.format.type; }
    if (typeof this.format.fmt !== 'undefined') { obj.FieldFormat.Fmt = this.format.fmt; }
    if (typeof this.format.nDec !== 'undefined') { obj.FieldFormat.nDec = this.format.nDec; }
    if (typeof this.format.useThou !== 'undefined') { obj.FieldFormat.UseThou = this.format.useThou; }
    if (typeof this.format.decSep !== 'undefined') { obj.FieldFormat.Dec = this.format.decSep; }
    if (typeof this.format.thouSep !== 'undefined') { obj.FieldFormat.Thou = this.format.thouSep; }
    if (obj.FieldFormat.Fmt && this.format.type === 'TIMESTAMP') {
      obj.FieldFormat.Fmt = misc.toQvxDateFormat(obj.FieldFormat.Fmt);
    }
  }

  if (typeof this.decimals !== 'undefined' && !isNaN(this.decimals)) {

    obj.FixPointDecimals = this.decimals;
  }
  debug('qvx from %j', this, obj);
  return obj;
};


DATATYPE.interpretAsQvxCodePage = function (t) {
  var c = t.encoding.replace('-', '') === 'utf8' ? 65000 : 12000;
  c += (t.endian === 'little' ? 1 : 0);
  return c;
};

function interpretAsQvxType(t) {
  if (qvxconst.typeName.hasOwnProperty(t.field)) {
    return qvxconst.typeName[t.field];
  }
  throw new TypeError('No QVX type for `' + t.field + '`');
}


var NumberType = function (name, options) {
  if (!(this instanceof NumberType)) {
    return new NumberType(name, options);
  }

  options = extend({
    bytes: 8,
    field: 'float'
  }, options);

  options.decimals = options.decimals;
  this.decimals = options.decimals;
  DATATYPE.call(this, options, name);
};

util.inherits(NumberType, DATATYPE);

NumberType.prototype.type = NumberType.type = 'Number';


var DateType = function (name, options) {
  if (!(this instanceof DateType)) {
    return new DateType(name, options);
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

  DATATYPE.call(this, options, name);
};

util.inherits(DateType, DATATYPE);

DateType.prototype.type = DateType.type = 'Date';

DateType.prototype.read = function (cursor) {
  debug('DateType#read');
  var v = DATATYPE.prototype.read.call(this, cursor);
  if (v && v.length >= this.format.fmt.length) {
    v = moment(v, this.format.fmt).toDate();
    debug('Date converted to', v);
  }
  return v;
};


var StringType = function (name, options) {
  if (!(this instanceof StringType)) {
    return new StringType(name, options);
  }
  options = extend({
    extent: 'counted',
    bytes: 4,
    field: 'text',
    encoding: 'utf-8'
  }, options);

  DATATYPE.call(this, options, name);
};

util.inherits(StringType, DATATYPE);

StringType.prototype.type = StringType.type = 'String';


var DualType = function (name, options) {
  if (!(this instanceof DualType)) {
    return new DualType(name, options);
  }
  options.field = 'dual';
  options.extent = 'special';
  options.bytes = options.bytes || 0;
  options.decimals = typeof options.decimals === 'undefined' ? 0 : options.decimals;
  options.format = options.format || {};
  options.format.type = options.format.type || 'UNKNOWN';
  options.format.fmt = options.format.fmt || '';
  options.format.nDec = options.format.nDec || 0;
  options.format.useThou = options.format.useThou || 0;
  options.format.decSep = options.format.decSep || '';
  options.format.thouSep = options.format.thouSep || '';
  DATATYPE.call(this, options, name);
};

util.inherits(DualType, DATATYPE);

DualType.prototype.type = DualType.type = 'Dual';

DualType.prototype.read = function (cursor) {
  debug('DualType#read');
  var v = DATATYPE.prototype.read.call(this, cursor);
  debug('typeof', typeof v);
  if (typeof v === 'object' && v) {
    if (v.flag === 6 && v.value instanceof Array) {
      //should be same
      assert(v.value[0].toString(), v.value[1], 'Both string and double should be same');
      return v.value[0];
    }
    else {
      return v.value;
    }
  }
  return v;
};


module.exports = {
  Number: NumberType,
  Date: DateType,
  String: StringType,
  Dual: DualType
};
