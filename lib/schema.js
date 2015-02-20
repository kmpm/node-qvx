var debug = require('debug')('qvx:schema');

var Field = require('./field');
var Reader = require('./recordreader');


var Schema = module.exports = function (config) {
  config = config || {};
  this.tableName = config.tableName || 'table';
  this.useSeparator = config.useSeparator === true;
  this.recordFormat = config.recordFormat || 'array';
  this.fields = [];
};


Schema.prototype.bindReadCursor = function (cursor) {
  debug('schema#bindReadCursor');
  return new Reader(this, cursor);
};

Schema.fromQvx = function (qvx) {
  var s = new Schema({
    tableName: qvx.QvxTableHeader.TableName,
    useSeparator: qvx.QvxTableHeader.UsesSeparatorByte === "true"
  });

  qvx.QvxTableHeader.Fields.QvxFieldHeader.forEach(function (config) {
    this.fields.push(Field.fromQvx(config));
  }.bind(s));

  return s;
}