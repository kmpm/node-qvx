var debug = require('debug')('qvx:schema');
var xml2js = require('xml2js');
var extend = require('util')._extend;

var Field = require('./field');
var Reader = require('./record-reader');

var pgk = require('../package.json');

function utcNow () {
  var d = (new Date()).toISOString().replace('T', ' ');
  return d.substr(0, d.indexOf('.'));
}

var Schema = module.exports = function (config) {
  config = config || {};
  this.tableName = config.tableName || 'table';
  this.useSeparator = typeof config.useSeparator === 'undefined' ? true : config.useSeparator === true;
  this.recordFormat = config.recordFormat || 'array';
  var fields = []
  this.fields = fields;
  if (config.fields) {
    Object.keys(config.fields).forEach(function (name) {
      var c = config.fields[name];
      var f = new Field({
        name: name,
        type: c.type
      });
      fields.push(f);
    });
  }
};


Schema.prototype.bindReadCursor = function (cursor) {
  debug('schema#bindReadCursor');
  return new Reader(this, cursor);
};


Schema.prototype.addField = function (config) {
  var f;
  if (config instanceof Field) {
    f = config;
  }
  else {
    f = new Field(config);
  }
  this.fields.push(f);
  return f;
}

Schema.prototype.toQvx = function (opts) {
  debug('toQvx');
  opts = opts || {};
  var builder = new xml2js.Builder({
    renderOpts: {pretty: opts.pretty === true },
    xmldec: {standalone: null, encoding: 'utf-8'}
  });

  var version = pgk.version.split('.');
  var obj = {
    MajorVersion: 1,
    MinorVersion: 0,
    CrateUtcTime: utcNow(),
    TableName: this.tableName,
    UsesSeparatorByte: this.useSeparator,
    Creator: {
      Company: 'node-qvx',
      MajorVersion: version[0],
      MinorVersion: version[1],
      MaintenanceVersion: version[2]
    },
    Fields: {
      QvxFieldHeader: this.fields.map(Field.toQvx)
    }
  };
  //debug('before fields', obj);
  debug('adding %s fields', this.fields.length);
  // obj.QvxTableHeader.Fields.QvxFieldHeader = extend(this.fields, {});
  // obj = JSON.stringify(obj, null, '  ');
  // debug('obj', obj);
  //debug('after fields: %j', obj);
  return builder.buildObject({QvxTableHeader: obj});
}

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

