var debug = require('debug')('qvx:record-writer');
var RecordWriter = module.exports = function (schema, cursor) {
  this.schema = schema;
  this.cursor = cursor;
  this.methods =  this.schema.fields.map(function (f) {
    return f.bindWriteCursor(cursor);
  });
}

RecordWriter.prototype.eof = function () {
   return (this.cursor.eof() || this.cursor.peekByte() === 0x1C);
};

RecordWriter.prototype.writeRecord = function (record) {
  debug('writeRecord', this.schema.useSeparator, this.schema.recordFormat);
  if (this.schema.useSeparator) {
    this.cursor.writeUInt8(0x1E);
  }
  if (this.schema.recordFormat === 'object') {
    var obj = {};
    for(var i = 0; i < this.schema.fields.length; i++) {
      var f = this.schema.fields[i];
      var name = f.name;
      this.methods[i](record[name]);

    }
  }
  else {
    throw new Error('array not supported for writing');
  }
}