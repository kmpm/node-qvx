var debug = require('debug')('qvx:schema');
var xml2js = require('xml2js');
// var extend = require('util')._extend;
// var util = require('util');

var Field = require('./field');
var Reader = require('./record-reader');
var Writer = require('./record-writer');

var misc = require('./misc');

var qvxconst = require('./qvxconst');

var pgk = require('../package.json');


var Schema = module.exports = function (obj, options) {
  if(!(this instanceof Schema)) {
    return new Schema(obj, options);
  }

  this.paths = {}

  if (obj) {
    this.add(obj);
  }


  // config = config || {};
  // this.tableName = config.tableName || 'table';
  // this.useSeparator = typeof config.useSeparator === 'undefined' ? true : config.useSeparator === true;
  // this.recordFormat = config.recordFormat || 'array';
  // this.createdAt = config.createdAt || misc.utcNow();
  // this.creator = (typeof config.creator === 'undefined' ? true : config.creator);
  // var fields = [];
  // this.fields = fields;
  // if (config.fields) {
  //   Object.keys(config.fields).forEach(function (name) {
  //     try {
  //       var c = config.fields[name];
  //       var f = new Field({
  //         name: name,
  //         type: (typeof c.type === 'function' ? c.type() : c.type)
  //       });
  //       debug('"%s" is %s(%j)', f.name, f.type.key, f.type.options);
  //       fields.push(f);
  //     }
  //     catch(err) {
  //       console.log(name);
  //       throw err;
  //     }

  //   });
  // }
};

Schema.Types = Types = require('./data-types');


Schema.reserved = Object.create(null);
var reserved = Schema.reserved;
reserved.on =
reserved.once = 1;


Schema.prototype.add = function (obj) {
  var keys = Object.keys(obj);
  for(var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if(null === obj[key]) {
      throw new TypeError('Invalid schema path `' + key + '`');
    }

    this.path(key, obj[key]);
  }
};


Schema.prototype.path = function (path, obj) {
  // some path names conflict with document methods
  if (reserved[path]) {
    throw new Error("`" + path + "` may not be used as a schema pathname");
  }

  this.paths[path] = Schema.interpretAsType(path, obj);
};


Schema.interpretAsType = function (path, obj) {
  debug('interpretAsType("%s", %j)', path, obj);
  if(obj.constructor && obj.constructor.name !== 'Object') {
    obj = {type: obj};
  }
  var type = obj.type && !obj.type.type
    ? obj.type
    : {};

  var name = 'string' == typeof type
    ? type
    : type.name;

  if (name) {
    name = name.charAt(0).toUpperCase() + name.substring(1);
  }

  if (undefined == Types[name]) {
    throw new TypeError('Undefined type `' + name + '` at `' + path + '`');
  }
  return new Types[name](path, obj);
}


Schema.fromQvx = function (qvx) {

  var s = new Schema({
    // tableName: qvx.QvxTableHeader.TableName,
    // useSeparator: qvx.QvxTableHeader.UsesSeparatorByte === 'true'
  });

  qvx.QvxTableHeader.Fields.QvxFieldHeader.forEach(function (config) {
    var obj = {
      'type': qvxconst.qvxToType[config.Type],
      field: qvxconst.qvxToField[config.Type],
      bytes: parseInt(config.ByteWidth),
      decimals: (config.FixPointDecimals ? parseInt(config.FixPointDecimals) : config.FixPointDecimals)
    }

    if (config.FieldFormat) {
      obj.format = {};
      obj.format.type = config.FieldFormat.Type;
      obj.format.fmt = config.FieldFormat.Fmt;

      if (config.FieldFormat.Type === 'TIMESTAMP') {
        obj.type = 'Date';
        obj.format.fmt = misc.fromQvxDateFormat(obj.format.fmt);
      }
    }
    var spec = {};
    spec[config.FieldName] = obj;

    // console.log("%j", spec);
    this.add(spec);
    // this.fields.push(Field.fromQvx(config));
  }.bind(s));

  return s;
};

Schema.prototype.bindReadCursor = function (cursor) {
  debug('schema#bindReadCursor');
  return new Reader(this, cursor);
};


/*
******************** OLD!!!!! ***************************
*/



// Schema.prototype.bindWriteCursor = function (cursor) {
//   var writer = new Writer(this, cursor);
//   return writer;
// };


// Schema.prototype.addField = function (config) {
//   var f;
//   if (config instanceof Field) {
//     f = config;
//   }
//   else {
//     f = new Field(config);
//   }
//   this.fields.push(f);
//   return f;
// };

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
    CreateUtcTime: misc.formatDate(this.createdAt),
    TableName: this.tableName,
    UsesSeparatorByte: this.useSeparator
  };

  if (this.creator === true) {
    obj.Creator = {
      Company: 'node-qvx',
      MajorVersion: version[0],
      MinorVersion: version[1],
      MaintenanceVersion: version[2]
    };
  }

  obj.Fields = {
    QvxFieldHeader: this.fields.map(Field.toQvx)
  };

  debug('creating xml');
  return builder.buildObject({QvxTableHeader: obj});
};
