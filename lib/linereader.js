var debug = require('debug')('qvx:linereader');
var BufferCursor = require('./mybuffercursor');
var moment = require('moment');

function createReader(f) {

  var name = 'read';
  var endianess = f.BigEndian ? 'BE' : 'LE';
  var enc = 'utf-8';
  var size = f.ByteWidth;
  var args = [];
  switch (f.Type) {
    case 'QVX_IEEE_REAL':
      if (f.ByteWidth === 8) {
        name += 'Double';
      }
      else {
        name += 'Float';
      }
      name += endianess;
      break;
    case 'QVX_SIGNED_INTEGER':
      name += 'Int';
      break;
    case 'QVX_TEXT':
      name = 'toString';
      if (f.CodePage === '1200' || f.CodePage === '1201') {
        enc = 'utf-16';
      }
      break;
    case 'QVX_PACKED_BCD':
      name += 'Bcd';
       break;
    default:
      throw new Error(f.Type + ' not implemented');

  }//-switch

  return function (bc) {

    if (f.NullRepresentation === 'QVX_NULL_FLAG_SUPPRESS_DATA') {
      if(bc.readUInt8() === 1) {
        return null;
      }
    }
    else {
      throw new Error('Null representation ' + f.NullRepresentation + ' is not implemented');
    }
    debug('processing field %s as "%s". Type: %s, ByteWidth: %s, Extent: %s',
      f.FieldName, name, f.Type, f.ByteWidth, f.Extent);

    var value = null;
    if (typeof bc[name] === 'function') {

      if (name === 'toString') {
        args[0] = enc;
        if (f.Extent === 'QVX_FIX') {
          args[1] = size;
        }
        else if (f.Extent === 'QVX_COUNTED') {
          size = bc.readUInt(f.ByteWidth, endianess);
          args[1] = size;
        }
        else {
          throw new Error('Extent ' + f.Extent + ' is not implemented');
        }
        debug(name, f.Extent, args);
        value = bc.toString.apply(bc, args);
        if (f.FieldFormat && f.FieldFormat.Type === 'TIMESTAMP') {
          value = moment(value, f.FieldFormat.Fmt);
        }
      }//-toString
      else if (name === 'readInt' || name === 'readUInt') {
        value = bc[name].call(bc, size, endianess);
      }//-readInt/readUInt
      else if (name === 'readBcd'){
        value = bc[name].call(bc, size);
      }
      else {
        value = bc[name].call(bc);
      }
    }//-function
    else {
      bc.seek(bc.tell() + f.ByteWidth);
      value = 'unknown, ' + name;
    }
    debug('done with field', f.FieldName, f.ByteWidth, name, value);
    return value;
  };//-function

}//-createReader


var LineReader = module.exports = function (header, options) {
  this.options = options || {};
  this.objectFormat = this.options.objectFormat || 'array';
  this.header = header.QvxTableHeader;
  this.UsesSeparatorByte = this.header.UsesSeparatorByte === 'true';
  this.fields = this.header.Fields.QvxFieldHeader;

  this.fields.forEach(function (f) {
    f.ByteWidth = parseInt(f.ByteWidth);
    f.BigEndian = f.BigEndian === 'true';
    f.read = createReader(f);
  });
  this.bc = null;
  debug('LineReader created');
  this.eof = false;
};


LineReader.prototype.parse = function (buf) {
  debug('parsing buffer');
  if(typeof buf !== 'undefined') {
    if (this.bc === null) {
      this.bc = new BufferCursor(buf);
    }
    else {
      var oldIndex = this.bc.tell();
      this.bc = new BufferCursor(Buffer.concat([this.bc.buffer, buf]));
      this.bc.seek(oldIndex);
    }
  }
  var bc = this.bc;
  var fieldIndex = 0;
  var obj;
  if (this.objectFormat === 'array') {
    obj = [];
  }
  else {
    obj = {};
  }
  if (this.UsesSeparatorByte) {
    var rc = bc.readUInt8();
    if (rc !== 0x1E) {
      throw new Error('Bad Record separator:' + rc.toString(16));
    }
  }
  while (fieldIndex < this.fields.length) {
    var f = this.fields[fieldIndex++];
    var value = f.read(bc);
    if (this.objectFormat === 'array') {
      obj.push(value);
    }
    else {
      obj[f.FieldName] = value;
    }
  }//-while
  debug('line parsed', obj);
  if (bc.peekByte() === 0x1C) {
    this.eof = true;
  }
  return obj;
};//-parse
