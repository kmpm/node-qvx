var debug = require('debug')('qvx:linereader');
var BufferCursor = require('./mybuffercursor');


function createReader(f) {

  var name = 'read';
  var endianess = f.BigEndian ? 'BE' : 'LE';
  var enc = 'utf-8';
  var size = f.ByteWidth;
  var args=[];
  switch (f.Type) {
    case 'QVX_IEEE_REAL':
      if (f.ByteWidth === 8) {
        name += 'Double'
      }
      else {
        name += 'Float';
      }
      name += endianess;
      break;
    case 'QVX_SIGNED_INTEGER':
      name += 'Int'
      break;
    case 'QVX_TEXT':
      name = 'toString';
      if (f.CodePage === '1200' || f.CodePage === '1201') {
        enc = 'utf-16';
      }
      break;

  }//-switch

  return function (bc) {

    if (f.NullRepresentation === 'QVX_NULL_FLAG_SUPPRESS_DATA') {
      if(bc.readUInt8() === 1) {
        return null;
      }
    }
    else {
      throw new Error('Null representation ' + f.NullRepresentation ' is not implemented');
    }
    debug('processing field %s as %s. Type: %s, ByteWidth: %s, Extent: %s',
      f.FieldName, name, f.Type, f.ByteWidth, f.Extent);

    var value = null;
    if (typeof bc[name] === 'function') {

      if (name === 'toString') {
        args[0] = enc;
        if (f.Extent === 'QVX_FIX') {
          args[1] = size;
        }
        else if (f.Extent === 'QVX_COUNTED') {
          size = bc.readUInt(size, endianess);
          args[1] = size;
        }
        else {
          throw new Error('Extent ' + f.Extent + ' is not implemented');
        }
        debug(name, f.Extent, args);
        value = bc.toString.apply(bc, args);
      }//-toString
      else if (name === 'readInt' || name == 'readUInt') {
        value = bc[name].call(bc, size, endianess);
      }//-readInt/readUInt
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
  }

}




var LineReader = module.exports = function (header) {

  this.header = header.QvxTableHeader;
  this.UsesSeparatorByte = this.header.UsesSeparatorByte === "true";
  this.fields = this.header.Fields.QvxFieldHeader;

  this.fields.forEach(function (f) {
    f.ByteWidth = parseInt(f.ByteWidth);
    f.BigEndian = f.BigEndian === "true";
    f.read = createReader(f)
  });
  debug('LineReader created');
};


LineReader.prototype.parse = function (buf) {
  debug('parsing buffer');
  var fieldIndex = 0;
  var bc = new BufferCursor(buf);
  var obj = {};
  if (this.UsesSeparatorByte) {
    var rc = bc.readUInt8();
    if (rc !== 0x1E) {
      throw new Error('Bad Record separator:' + rc.toString(16));
    }
  }
  while (fieldIndex < this.fields.length) {
    var f = this.fields[fieldIndex++];
    var value = f.read(bc)
    obj[f.FieldName] = value;
  }//-while
  debug('line parsed', obj);
}//-parse
