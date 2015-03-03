var debug = require('debug')('qvx:schema');
var xml2js = require('xml2js');
var extend = require('util')._extend;
// var util = require('util');

var misc = require('./misc');
var qvxconst = require('./qvxconst');
var pkg = require('../package.json');

var Types;

var Schema = module.exports = function (options) {
  if(!(this instanceof Schema)) {
    return new Schema(obj, options);
  }

  if(arguments.length > 1) {
    throw new Error('Only one argument is supported');
  }
  this.fields = [];

  options = options || {};
  this.tableName = options.tableName || 'table';
  this.useSeparator = typeof options.useSeparator === 'undefined' ? true : options.useSeparator === true;
  this.recordFormat = options.recordFormat || 'array';
  this.createdAt = (typeof options.createdAt !== 'undefined' ? options.createdAt : misc.utcNow());
  this.timezone = options.timezone;
  this.creator = (typeof options.creator === 'undefined' ? true : options.creator);
  this.blockSize = typeof options.blockSize === 'undefined' ? undefined : parseInt(options.blockSize);

  if (this.blockSize && this.blockSize >0) {
    throw new Error('Block sized data is not yet supported');
  }

  if (this.creator === true) {
    var version = pkg.version.split('.');
    this.creator = {
      company: pkg.author,
      product: 'node-qvx',
      majorVersion: version[0],
      minorVersion: version[1],
      maintenanceVersion: version[2]
    };
  }



  if (options.fields) {
    this.add(options.fields);
  }
};

Schema.Types = Types = require('./data-types');


// Schema.reserved = Object.create(null);
// var reserved = Schema.reserved;
// reserved.on =
// reserved.once = 1;


Schema.prototype.add = function (obj) {
  var keys = Object.keys(obj);
  for(var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (obj[key] === null) {
      throw new TypeError('Invalid schema field `' + key + '`');
    }
    var name;
    if(isNaN(key)) {
      name = key;
    }
    else {
      name = obj[key].name;
    }
    this.field(name, obj[key]);
  }
};


Schema.prototype.field = function (fieldName, obj) {
  // some fieldName names conflict with document methods
  // if (reserved[fieldName]) {
  //   throw new Error("`" + fieldName + "` may not be used as a schema pathname");
  // }
  obj.timezone = obj.timezone || this.timezone;
  this.fields.push(Schema.interpretAsType(fieldName, obj));
};


Schema.interpretAsType = function (fieldName, obj) {
  debug('interpretAsType("%s", %j)', fieldName, obj);
  if(obj.constructor && obj.constructor.name !== 'Object') {
    obj = {type: obj};
  }
  var type = obj.type && !obj.type.type
    ? obj.type
    : {};

  var name = typeof type === 'string'
    ? type
    : type.name;

  if (name) {
    name = name.charAt(0).toUpperCase() + name.substring(1);
  }

  if (Types[name] === undefined) {
    throw new TypeError('Undefined type `' + name + '` at `' + fieldName + '`');
  }
  return new Types[name](fieldName, obj);
};


Schema.fromQvx = function (qvx, options) {
  options = options || {};
  var s = new Schema(extend(options, {
    useSeparator: qvx.QvxTableHeader.UsesSeparatorByte === 'true',
    createdAt: qvx.QvxTableHeader.CreateUtcTime,
    tableName: qvx.QvxTableHeader.TableName,
    blockSize: qvx.QvxTableHeader.BlockSize,
    creator: typeof qvx.QvxTableHeader.Creator === 'undefined' ? false : {
      company: qvx.QvxTableHeader.Creator.Company,
      product: qvx.QvxTableHeader.Creator.Product,
      majorVersion: qvx.QvxTableHeader.Creator.MajorVersion,
      minorVersion: qvx.QvxTableHeader.Creator.MinorVersion,
      maintenanceVersion: qvx.QvxTableHeader.Creator.MaintenanceVersion
    }

  }));

  qvx.QvxTableHeader.Fields.QvxFieldHeader.forEach(function (config) {
    var obj = {
      'type': qvxconst.qvxToType[config.Type],
      field: qvxconst.qvxToField[config.Type],
      bytes: parseInt(config.ByteWidth),
      decimals: (typeof config.FixPointDecimals !== 'undefined' ?
        parseInt(config.FixPointDecimals) : config.FixPointDecimals),
      extent: qvxconst.qvxToExtent[config.Extent],
      whenNull: qvxconst.qvxToNullRepresentation[config.NullRepresentation]
    };

    if (config.FieldFormat) {
      obj.format = {};
      obj.format.type = config.FieldFormat.Type;
      obj.format.fmt = config.FieldFormat.Fmt;
      obj.format.useThou = isNaN(config.FieldFormat.UseThou) ? undefined : config.FieldFormat.UseThou;
      obj.format.nDec = config.FieldFormat.nDec;
      obj.format.thouSep = config.FieldFormat.Thou;
      obj.format.decSep = config.FieldFormat.Dec;
      if (config.FieldFormat.Type === 'TIMESTAMP' && obj.type) {
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


Schema.prototype.toQvxSpec = function () {

  var obj = {
    MajorVersion: 1,
    MinorVersion: 0,
    CreateUtcTime: (typeof this.createdAt === 'string' ? this.createdAt : misc.formatDate(this.createdAt)),
    TableName: this.tableName,
    UsesSeparatorByte: this.useSeparator
  };

   if (this.creator) {
    obj.Creator = {
      Company: this.creator.company,
      Product: this.creator.product,
      MajorVersion: this.creator.majorVersion,
      MinorVersion: this.creator.minorVersion,
      MaintenanceVersion: this.creator.maintenanceVersion
    };
  }

  obj.Fields = {
    QvxFieldHeader: this.fields.map(function (f) {
      return f.toQvxSpec();
    })
  };
  return obj;
};


Schema.prototype.toQvx = function (opts) {
  debug('toQvx');
  opts = opts || {};
  var builder = new xml2js.Builder({
    renderOpts: {pretty: opts.pretty === true },
    xmldec: {standalone: null, encoding: 'utf-8'}
  });

  var obj = this.toQvxSpec();

  debug('creating xml');
  // console.log(util.inspect(obj.Fields.QvxFieldHeader, {depth: null}));
  return builder.buildObject({QvxTableHeader: obj});
};
