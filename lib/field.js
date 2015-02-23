
var debug = require('debug')('qvx:field');
var extend = require('util')._extend;

// var NUMBER_TYPES = ['QVX_IEEE_REAL'];

var DataTypes = require('./data-types');

var Field = function (config) {
  config = config || {};
  this.type = config.type || '';
  this.name = config.name || '';
  this.encoding = config.encoding || 'utf-8';
  this.bigEndian = config.bigEndian === true;
  this.nullHandler = 'supress';
};
module.exports = Field;

Field.prototype.bindReadCursor = function (cursor) {
  return function readField() {
    if (this.nullHandler === 'supress') {
      if (cursor.readUInt8() === 1) {
        debug('reading "%s" as %s was null', this.name, this.type.key);
        return null;
      }
    }//--supress
    else if (this.nullHandler !== 'none') {
      throw new Error('Unimplemented nullHandler:' + this.nullHandler);
    }
    var v = this.type.read(cursor);
    debug('"%s"(%s) = %s', this.name, this.type.key, v);
    return v;
  }.bind(this);
};


Field.prototype.bindWriteCursor = function (cursor) {
  return function writeField(value) {
    if (this.nullHandler === 'supress') {
      if (value === null || typeof value === 'undefined') {
        cursor.writeUInt8(1);
        debug('"%s" was null', this.name);
        return;
      }
      else {
        cursor.writeUInt8(0);
      }
    }//--supress
    else if (this.nullHandler === 'none') {
      if (value === null || value === undefined) {
        throw new Error('Null not allowed');
      }
    }
    else {
      throw new Error('Unimplemented nullHandler:' + this.nullHandler);
    }
    debug('"%s" writing %s', this.name, value);
    this.type.write(cursor, value);
  }.bind(this);
};


Field.toQvx = function (f) {
  var spec = {
    FieldName: f.name,
    Type: '',
    Extent: '',
    NullRepresentation: '',
    BigEndian: f.bigEndian,
    CodePage: false,
    ByteWidth: ''
  };
  var tspec = f.type.toQvxSpec();
  debug('tspec', tspec);
  spec = extend(spec, tspec);
  spec.NullRepresentation = (f.nullHandler === 'supress' ? 'QVX_NULL_FLAG_SUPPRESS_DATA' :
      (f.nullHandler === 'none' ? 'QVX_NULL_NEVER' : ''));

  if (!spec.CodePage) {
    spec.CodePage = f.encoding === 'utf-16' ? 12001 : 65001;
  }

  // spec = extend(spec, {
  //   ByteWidth: 4,
  //     BigEndian: f.bigEndian,
  //     CodePage: (f.encoding === 'utf-8' ? 65001 : 1201)
  // });

  return spec;
};


Field.fromQvx = function (qvx) {
  //debug('Field named %s', qvx.FieldName);
  qvx.ByteWidth = parseInt(qvx.ByteWidth) * 1;

  var f = new Field({
    name: qvx.FieldName,
    bigEndian: (qvx.BigEndian === 'true') || (qvx.BigEndian === 1)
  });

  if (qvx.CodePage === '1200' || qvx.CodePage === '1201') {
    this.encoding = 'utf-16';
  }

  if(qvx.NullRepresentation === 'QVX_NULL_NEVER') {
    f.nullHandler = 'none';
  }

  switch (qvx.Type) {
    case 'QVX_IEEE_REAL':
      f.type = DataTypes.FLOAT(qvx.ByteWidth, qvx.BigEndian);
      break;
    case 'QVX_PACKED_BCD':
      f.type = DataTypes.BCD();
      // debug('"%s" is BCD(%j)', f.name, f.type.options);
      break;
    case 'QVX_SIGNED_INTEGER': //default format
      f.type = qvx.ByteWidth < 8 ? DataTypes.INTEGER(qvx.ByteWidth, qvx.BigEndian) : DataTypes.BIGINT(qvx.BigEndian);
      // debug('"%s" is %s(%j) ', f.name, f.type.key, f.type.options);
      break;
    case 'QVX_TEXT':
      var length = qvx.ByteWidth;
      var endian = qvx.BigEndian === true;
      var extent;
      if (qvx.Extent === 'QVX_COUNTED') { extent = 'counted'; }
      else if (qvx.Extent === 'QVX_FIX') { extent = 'fix'; }
      else if (qvx.Extent === 'QVX_ZERO_TERMINATED') { extent = 'terminated'; }

      if (qvx.FieldFormat && qvx.FieldFormat.Type === 'TIMESTAMP') {
        // debug('"%s" is a TIMESTAMP(%s, %s, %s, %s)', f.name, f.encoding,
        //   length, endian, qvx.FieldFormat.Fmt);
        f.type = DataTypes.TIMESTAMP(f.encoding, length, endian, extent, qvx.FieldFormat.Fmt);
      }
      else {
        f.type = DataTypes.STRING(this.encoding, length, endian, extent);
        // debug('"%s" is %s(%s, %s, %s)', f.name, f.type.key, this.encoding, length, endian);
      }
      break;
    case 'QVX_QV_DUAL':
      f.type = DataTypes.DUAL();
      break;
    default:
      throw new Error('Unsupported field type, ' + qvx.Type);
  }

  if (typeof f.type === 'function') {
    f.type = f.type();
  }

  if (qvx.FixPointDecimals) {
    f.type.DECIMALS(parseInt(qvx.FixPointDecimals));
  }

  debug('"%s" is %s(%j)', f.name, f.type.key, f.type.options);
  return f;
};
