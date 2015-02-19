var debug = require('debug')('qvx:qvxcursor');
var QvxCursor = require('buffercursor');
var bignum = require('bignum');

module.exports = QvxCursor;


QvxCursor.prototype.QVX_IEEE_REAL = function (qvxfield) {
  var big = qvxfield.BigEndian === true ? true : false;
  var bytes = qvxfield.ByteWidth;
  var name = 'read' +
    bytes === 8 ? 'Double' : 'Float' +
    big === true ? 'BE' : 'LE';
  return function () {
    this[name].call(this);
  };
}


QvxCursor.prototype.getReader = function (qvxfield) {
  return this[qvxfield.Type](qvxfield);
};