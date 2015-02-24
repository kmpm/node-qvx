/*eslint capIsNewExceptions: [Element], no-underscore-dangle: 0  */
/*eslint no-underscore-dangle: 0 */
var debug = require('debug')('qvx:outbound');
var Transform = require('stream').Transform;
var util = require('util');

var Schema = require('./schema');
var Cursor = require('./extended-cursor');

/*
 * Write stuff to qvx
 */
var Outbound = module.exports = function (schema, opt) {
  if(!(schema instanceof Schema)) {
    throw new TypeError('schema is not a Schema');
  }
  Transform.call(this, {objectMode: true});
  this._readableState.objectMode = false;
  this._readableState.encoding = 'utf-8'
  opt = opt || {};
  opt.pretty = opt.pretty === true;
  this.options = opt;
  this.schema = schema;
  this._schemaWritten = false;
};

util.inherits(Outbound, Transform);


Outbound.prototype._transform = function (chunk, enc, done) {
  debug('_transform(%s, %s)', typeof chunk, enc);
  var cursor, buf;
  if (!this._schemaWritten) {
    var xml = this.schema.toQvx({pretty: this.options.pretty});
    buf = new Buffer(xml.length + 1);
    cursor = new Cursor(buf);
    cursor.write(xml);
    cursor.writeUInt8(0);
    this.push(cursor.buffer);
    this._schemaWritten = true;
  }
  buf = new Buffer(2048);
  cursor = new Cursor(buf);
  var writer = this.schema.bindWriteCursor(cursor);
  writer.writeRecord(chunk);
  debug('pushing %s bytes', cursor.tell());
  this.push(cursor.buffer.slice(0, cursor.tell()), enc);
  done();
};


Outbound.prototype._flush = function (done) {
  debug('flushing');
  this.push(new Buffer([0x1C]), 'utf-8');
  done();
};
