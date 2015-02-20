var debug = require('debug')('qvx:recordreader');
var Reader = module.exports = function (schema, cursor) {
  this.schema = schema;
  this.cursor = cursor;
  this.methods =  this.schema.fields.map(function (f) {
    return f.bindReadCursor(cursor);
  });

}

Reader.prototype.eof = function () {
   return (this.cursor.eof() || this.cursor.peekByte() === 0x1C);
};

Reader.prototype.readRecord = function () {
  debug('readRecord', this.schema.useSeparator, this.schema.recordFormat);
  if (this.schema.useSeparator) {
    var rc = this.cursor.readUInt8();
    // debug('record separator 0x%s at 0x%s', rc.toString(16), (this.cursor.tell() - 1).toString(16));
    if (rc !== 0x1E) {
      throw new Error('Bad Record separator:' + rc.toString(16));
    }
  }
  if (this.schema.recordFormat === 'object') {
    var obj = {};
    for(var i = 0; i < this.schema.fields.length; i++) {
      obj[this.schema.fields[i].name] = this.methods[i]();
    }
    return obj;
  }
  else {
    return this.methods.map(function (m) {
      return m();
    });
  }
}