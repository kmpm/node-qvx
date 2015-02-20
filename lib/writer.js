/*eslint capIsNewExceptions: [Element], no-underscore-dangle: 0  */
/*eslint no-underscore-dangle: 0 */
var debug = require('debug')('qvx:writer');
var xml2js = require('xml2js');
var extend = require('util')._extend;
var QvxField = require('./qvxfield');
var Transform = require('stream').Transform;
var util = require('util');


function utcNow () {
  var d = (new Date()).toISOString().replace('T', ' ');
  return d.substr(0, d.indexOf('.'));
}


/*
 * Write stuff to qvx
 */
var Writer = module.exports = function (config) {

  Transform.call(this, {objectMode: true});

  config.CreateUtcTime = config.CreateUtcTime || utcNow();
  this.header = config;
  this.fields = [];
};

util.inherits(Writer, Transform);


Writer.prototype.generateFields = function (sample) {

  var fields = [];
  Object.keys(sample).forEach(function (key) {
    var config = sample[key];
    fields.push(new QvxField(key, config));
  });
  this.fields = fields;
};

Writer.prototype.headerToXml = function () {
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


Writer.prototype._transform = function (chunk, enc, done) {
  debug('_transform', enc);
}