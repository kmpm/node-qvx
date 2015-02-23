/*eslint capIsNewExceptions: [Element], no-underscore-dangle: 0  */
/*eslint no-underscore-dangle: 0 */
var debug = require('debug')('qvx:outbound');
var xml2js = require('xml2js');
var Transform = require('stream').Transform;
var util = require('util');

var misc = require('./misc');
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
  opt = opt || {};
  opt.pretty = opt.pretty === true;
  this.options = opt;
  this.schema = schema;
  this._schemaWritten = false;
};

util.inherits(Outbound, Transform);


// Outbound.prototype.generateFields = function (sample) {

//   var fields = [];
//   Object.keys(sample).forEach(function (key) {
//     var config = sample[key];
//     fields.push(new QvxField(key, config));
//   });
//   this.fields = fields;
// };

Outbound.prototype.headerToXml = function () {
  debug('headerToXml');
  var builder = new xml2js.Builder({
    renderOpts: {pretty: false},
    xmldec: {standalone: null, encoding: 'utf-8'}
  });

  var obj = {
    'QvxTableHeader': extend(this.header, {Fields: {QvxFieldHeader: []}})
  };
  //debug('before fields', obj);
  debug('adding %s fields', this.fields.length);
  obj.QvxTableHeader.Fields.QvxFieldHeader = extend(this.fields, {});
  obj = JSON.stringify(obj, null, '  ');
  debug('obj', obj);
  //debug('after fields: %j', obj);
  return builder.buildObject(JSON.parse(obj));
};


Outbound.prototype._transform = function (chunk, enc, done) {
  debug('_transform', enc, typeof chunk);
  var cursor, buf;
  if (!this._schemaWritten) {
    var xml = this.schema.toQvx({pretty: this.options.pretty});
    buf = new Buffer(xml.length +1);
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
  this.push(cursor.buffer.slice(0, cursor.tell()));
  done();
}


Outbound.prototype._flush = function (done) {
  debug('flushing');
  this.push(new Buffer([0x1C]));
  done();
};
