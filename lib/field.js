
var debug = require('debug')('qvx:field');
var NUMBER_TYPES = ['QVX_IEEE_REAL'];

var DataTypes = require('./datatypes');

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
  var name;
  var size = null;
  var argEnc = null;
  if(this.type === Number) {
    name = 'read' + this.size;
  }
  else if (this.type === String) {
    name = 'toString';
    size = this.size;
    argEnc = this.encoding;
  }
  else if (this.type === DataTypes.Timestamp) {
    name = 'readDate'
    size = this.size;
    argEnc = this.encoding;
  }
  else if (this.type === DataTypes.Dual) {
    name = 'readDual';
  }

  if (typeof cursor[name] !== 'function') {
    throw new Error(name + ' is not implemented' + this.type);
  }

  return function readField() {

    var argSize = null;
    if (this.nullHandler === 'supress') {
      if (cursor.readUInt8() === 1) {
        debug('reading "%s" as %s was null', this.name, name);
        return null;
      }
    }//--supress
    else if (this.nullHandler !== 'never') {
      throw new Error('Unimplemented nullHandler:' + this.nullHandler);
    }

    argSize = size;
    if(typeof size === 'function') {
      argSize = size(cursor);
    }
    debug('reading "%s" as %s(%s, %s) at 0x%s', this.name, name, argEnc, argSize, cursor.tell().toString(16));
    var v = cursor[name].call(cursor, argEnc, argSize);
    debug('%s = %s', this.name, v);
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



Field.prototype.toQvx = function () {

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
    f.nullHandler = 'never';
  }


  switch (qvx.Type) {
    case 'QVX_PACKED_BCD':
      f.storageFormat = 'bcd';
    case 'QVX_IEEE_REAL':
      f.storageFormat = f.storageFormat || 'decimal';
      f.size = f.size || (qvx.ByteWidth === 8 ? 'Double' : 'Float') + (f.bigEndian ? 'BE' : 'LE');
    case 'QVX_SIGNED_INTEGER': //default format
      //debug('is a Number');
      f.type = Number;
      f.size = f.size || 'Int' + qvx.ByteWidth * 8 + (f.bigEndian ? 'BE' : 'LE');
      break;
    case 'QVX_TEXT':
      if (qvx.FieldFormat && qvx.FieldFormat.Type === 'TIMESTAMP') {
        //debug('is a Date')
        f.type = DataTypes.Timestamp;
        f.dateFormat = qvx.FieldFormat.Fmt;
      }
      else {
        //debug('is a String', qvx.FieldFormat);
        f.type = String;
      }
      if (f.Extent === 'QVX_FIX') {
        f.size = qvx.ByteWidth;
      }
      else {
        var mName = 'readUInt' + (qvx.ByteWidth * 8) + (qvx.ByteWidth > 1 ? (f.bigEndian ? 'BE' : 'LE'): '');
        f.size = function (cursor) {
          debug('reading size as "%s" at 0x%s', mName, cursor.tell().toString(16));
          return cursor[mName].call(cursor);
        }
      }
      break;
    case 'QVX_QV_DUAL':
      f.type = DataTypes.Dual;
      break;
    default:
      throw new Error('Unsupported field type, ' + qvx.Type);
  }
  return f;
};
