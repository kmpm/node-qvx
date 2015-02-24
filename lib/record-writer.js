var Cursor = require('./extended-cursor');
var debug = require('debug')('qvx:record-writer');

var internal = {

  writeField: function (cursor, value) {
    if (this.whenNull === 'supress') {
      if (value === null || typeof value === 'undefined') {
        cursor.writeUInt8(1);
        debug('"%s" was null', this.name);
        return;
      }
      else {
        cursor.writeUInt8(0);
      }
    }//--supress
    else if (this.whenNull === 'none') {
      if (value === null || value === undefined) {
        throw new Error('Null not allowed');
      }
    }
    else {
      throw new Error('Unimplemented nullHandler:' + this.nullHandler);
    }
    debug('"%s" writing %s', this.name, value);
    this.write(cursor, value);
  }
};

var RecordWriter = module.exports = function (schema, recordFormat, cursor) {
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
  this.methods = this.schema.fields.map(function (f) {
    return internal.writeField.bind(f);
  });
};

RecordWriter.prototype.eof = function () {
  return (this.cursor.eof() || this.cursor.peekByte() === 0x1C);
};

RecordWriter.prototype.writeRecord = function (record) {
  debug('writeRecord', this.schema.useSeparator, this.schema.recordFormat);
  if (this.schema.useSeparator) {
    this.cursor.writeUInt8(0x1E);
  }
  if (this.recordFormat === 'object') {
    for(var i = 0; i < this.schema.fields.length; i++) {
      var f = this.schema.fields[i];
      var name = f.name;
      this.methods[i](this.cursor, record[name]);
    }
  }
  else {
    throw new Error('array not supported for writing');
  }
};
