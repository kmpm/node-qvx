var debug = require('debug')('qvx:qvxfield');

function isInteger(value) {
  return typeof value === "number" &&
   isFinite(value) &&
   Math.floor(value) === value;
};

var QvxField = module.exports = function (name, sample, options) {
  debug('QvxField("%s", %s (%s), %s)', name, sample, typeof sample, options);
  options = options || {};
  options.asNumber = options.asNumber === true ? true : false;
  var self = this;
  this.FieldName = name;
  this.NullRepresentation = 'QVX_NULL_FLAG_SUPRESS_DATA';
  this.BigEndian = false;
  this.CodePage = 65001;
  this.Type = 'NOT IMPLEMENTED';

  var t = typeof(sample);

  //force numeric
  if (options.asNumber) {
    t = 'number';
  }

  if (t === 'string') {
    this.Type = 'QVX_TEXT';
    this.Extent = 'QVX_COUNTED';
  }
  else if (t === 'number') {
    options.unsigned = options.unsigned === true ? true : false;
    options.decimal = options.decimal === true ? true : false;

    if (!options.decimal && isInteger(sample)) {
      if (options.unsigned) {

      }
      else {
        self.Type = 'QVX_SIGNED_INTEGER';
        self.Extent = 'QVX_FIX';
      }
    }
    else { //real
      self.Type = 'QVX_IEEE_REAL';
      self.Extent = 'QVX_FIX';
    }
  }//--number
  else {
    throw new Error('Type not implemented:' + t);
  }
}