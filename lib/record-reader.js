var debug = require('debug')('qvx:record-reader');

return function readField(cursor) {
  if (this.withNull === 'supress') {
    if (cursor.readUInt8() === 1) {
      debug('reading "%s" as %s was null', this.name, this.type.key);
      return null;
    }
  }//--supress
  else if (this.withNull !== 'none') {
    throw new Error('Unimplemented nullHandler:' + this.nullHandler);
  }
  var v = this.read(cursor);
  debug('"%s"(%s) = %s', this.name, this.type, v);
  return v;
}


var RecordReader = module.exports = function (schema, cursor) {
  this.schema = schema;
  this.cursor = cursor;
  this.methods = Object.keys(schema.paths).map(function (key) {
    var f = schema.paths[key];
    return readField.bind(f)
  });
};



RecordReader.prototype.eof = function () {
  return (this.cursor.eof() || this.cursor.peekByte() === 0x1C);
};

RecordReader.prototype.readRecord = function () {
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
};
