var debug = require('debug')('qvx:qvxfield');

function isInteger(value) {
  return typeof value === 'number' &&
   isFinite(value) &&
   Math.floor(value) === value;
}

var QvxField = module.exports = function (name, config) {
  debug('QvxField "%s"', name);
  var self = this;
  this.FieldName = name;
  this.NullRepresentation = 'QVX_NULL_FLAG_SUPRESS_DATA';
  this.BigEndian = false;
  this.CodePage = 65001;
  this.Type = 'NOT IMPLEMENTED';


  if (config.type === String) {
    this.Type = 'QVX_TEXT';
    this.Extent = 'QVX_COUNTED';
  }
  else if (config.type === Number) {
    self.Type = 'QVX_SIGNED_INTEGER';
    self.Extent = 'QVX_FIX';
    if (config.decimal === true) {
      self.Type = 'QVX_IEEE_REAL';
    }
  }//--Number
  else if (config.type === QvxField.DataTypes.Timestamp) {
    self.Type = 'QVX_TEXT';
    self.Extent = 'QVX_COUNTED';
    self.FieldFormat = new config.type().FieldFormat;
  }
  else {
    var err = new Error('Type not implemented:' + config.type + ' ' + name);
    err.FieldName = name;
    throw err;
  }
};

QvxField.prototype.write = function (cursor) {

};


QvxField.DataTypes = {
  Timestamp: function () {
    this.FieldFormat = {
      Type: 'TIMESTAMP',
      Fmt: 'YYYY-MM-DD hh:mm:ss.fff'
    };
  }
};
