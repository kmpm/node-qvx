
var debug = require('debug')('qvx:field');

var NUMBER_TYPES = ['QVX_IEEE_REAL'];

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
    var argSize = null;
    if (this.nullHandler === 'supress') {
      if (cursor.readUInt8() === 1) {
        debug('reading "%s" as %s was null', this.name, this.type.key);
        return null;
      }
    }//--supress
    else if (this.nullHandler !== 'never') {
      throw new Error('Unimplemented nullHandler:' + this.nullHandler);
    }
    var v = this.type.read(cursor);
    debug('"%s"(%s) = %s', this.name, this.type.key, v);
    return v;
  }.bind(this);
};


Field.prototype.bindWriteCursor = function (cursor) {
  if(this.type === Number) {

  }
  else if (this.type === String) {

  }
  else if (this.type === Date) {

  }
};


Field.toQvx = function (f) {
  return {
    FieldName: f.name,
    ByteWidth: 4,
    BigEndian: f.bigEndian,
    CodePage: (f.encoding === 'utf-8' ? 65001 : 1201)
  };
};


Field.fromQvx = function (qvx) {
  //debug('Field named %s', qvx.FieldName);
  qvx.ByteWidth = parseInt(qvx.ByteWidth) * 1;

  var f = new Field({
    name: qvx.FieldName,
    bigEndian: (qvx.BigEndian === "true") || (qvx.BigEndian === 1)
  });

  if (qvx.CodePage === '1200' || qvx.CodePage === '1201') {
    this.encoding = 'utf-16';
  }

  if(qvx.NullRepresentation === 'QVX_NULL_NEVER') {
    f.nullHandler = 'none';
  }


  switch (qvx.Type) {
    case 'QVX_IEEE_REAL':
      f.type = DataTypes.FLOAT(qvx.ByteWidth * 8, qvx.BigEndian);
      break;
    case 'QVX_PACKED_BCD':
      f.type = DataTypes.BCD();
      // debug('"%s" is BCD(%j)', f.name, f.type.options);
      break;
    case 'QVX_SIGNED_INTEGER': //default format
      f.type = qvx.ByteWidth < 8 ? DataTypes.INTEGER(qvx.ByteWidth * 8, qvx.BigEndian) : DataTypes.BIGINT(qvx.BigEndian);
      // debug('"%s" is %s(%j) ', f.name, f.type.key, f.type.options);
      break;
    case 'QVX_TEXT':
      var length = qvx.ByteWidth * 8;
      var counted = f.Extent === 'QVX_COUNTED';
      var endian = (counted && qvx.BigEndian === true ? 'BE' : 'LE');

      if (qvx.FieldFormat && qvx.FieldFormat.Type === 'TIMESTAMP') {
        // debug('"%s" is a TIMESTAMP(%s, %s, %s, %s)', f.name, f.encoding,
        //   length, endian, qvx.FieldFormat.Fmt);
        f.type = DataTypes.TIMESTAMP(f.encoding, length, endian, qvx.FieldFormat.Fmt);
      }
      else {
        f.type = DataTypes.STRING(this.encoding, length, endian);
        // debug('"%s" is %s(%s, %s, %s)', f.name, f.type.key, this.encoding, length, endian);
      }
      break;
    case 'QVX_QV_DUAL':
      f.type = DataTypes.DUAL();
      break;
    default:
      throw new Error('Unsupported field type, ' + qvx.Type);
  }

  debug('"%s" is %s(%j)', f.name, f.type.key, f.type.options);
  return f;
};
