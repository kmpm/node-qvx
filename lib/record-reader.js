var Cursor = require('./extended-cursor');
var debug = require('debug')('qvx:record-reader');

var internal = {
  readField: function (cursor) {
    if (this.whenNull === 'supress') {
      if (cursor.readUInt8() === 1) {
        debug('%s(%s)> as %s was null', this.name, this.wireFormat);
        return null;
      }
    }//--supress
    else if (this.whenNull !== 'none') {
      throw new Error('Unimplemented nullHandler:' + this.whenNull);
    }
    var v = this.read(cursor);
    return v;
  }
};


var RecordReader = module.exports = function (schema, recordFormat, cursor) {
  if (typeof schema !== 'object') {
    throw new TypeError('bad schema');
  }
  if (recordFormat !== 'object' && recordFormat !== 'array') {
    throw new TypeError('Bad recordFormat `' + recordFormat + '`');
  }
  if (cursor instanceof Buffer) {
    cursor = new Cursor(cursor);
  }
  if (!(cursor instanceof Cursor)) {
    throw new TypeError('Bad cursor ' + cursor);
  }
  this.schema = schema;
  this.cursor = cursor;
  this.recordFormat = recordFormat;
  this.methods = schema.fields.map(function (f) {
    return internal.readField.bind(f);
  });
};


RecordReader.prototype.eof = function () {
  return (this.cursor.eof() || this.cursor.peekByte() === 0x1C);
};

RecordReader.prototype.readRecord = function () {
  debug('readRecord, useSeparator:%s, recordFormat:%s', this.schema.useSeparator, this.recordFormat);

  if (this.schema.useSeparator) {
    var rc = this.cursor.readUInt8();
    // debug('record separator 0x%s at 0x%s', rc.toString(16), (this.cursor.tell() - 1).toString(16));
    if (rc !== 0x1E) {
      throw new Error('Bad Record separator:' + rc.toString(16));
    }
  }
  if (this.recordFormat === 'object') {
    var obj = {};
    for(var i = 0; i < this.schema.fields.length; i++) {
      obj[this.schema.fields[i].name] = this.methods[i](this.cursor);
    }
    return obj;
  }
  else {
    return this.methods.map(function (m) {
      return m(this.cursor);
    }.bind(this));
  }
};
