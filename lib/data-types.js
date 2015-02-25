var util = require('util');
var extend = util._extend;
var moment = require('moment');
var misc = require('./misc');

var debug = require('debug')('qvx:data-types');
// var errors = require('./errors');
var qvxconst = require('./qvxconst');


var DATATYPE = function (options, path) {
  this.name = options.name || path;
  this.endian = options.endian || 'little';
  this.bytes = options.bytes;
  this.field = options.field;
  this.extent = options.extent || 'fix';
  this.format = options.format;
  this.whenNull = options.whenNull || 'supress';
  this.encoding = options.encoding || 'utf-8';
};


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
  var wf = this.wireFormat;
  var args;
  var mName = 'read' + wf;
  if (typeof cursor[mName] !== 'function') {
    debug('error in read: %j', this);
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
  }
  else if (wf === 'Bcd') {
    args = [this.bytes];
  }

  var v = cursor[mName].apply(cursor, args);
  debug('%s(%s/%s)>', this.name, wf, this.type, v);
  return v;
};

DATATYPE.prototype.write = function (cursor, value) {
  var wf = this.wireFormat;
  var mName = 'write' + wf;
  if (typeof cursor[mName] !== 'function') {
    debug('error in write: %j', this);
    throw new Error( mName + ' does not exist in cursor');
  }

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
      cursor.writeString(value, value.length, this.encoding);
      return;
    }
    else if (this.extent === 'fix') {
      if (value.length > this.bytes) {
        throw new Error('value is to big');
      }
      cursor.write(value, value.length, value._encoding);
      if ((value.length - this.bytes) > 0) {
        cursor.fill(0, value.length - this.bytes);
      }
      return;
    }
    else {
      throw new Error('support extent ' + this.extent);
    }
  }

  cursor[mName](value);
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

DateType.prototype.read = function (cursor) {
  var v = DATATYPE.prototype.read.call(this, cursor);
  v = moment(v, this.format.fmt).toDate();
  debug('Date converted to', v);
  return v;
};

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
};
