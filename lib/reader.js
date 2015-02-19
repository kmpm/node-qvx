/*eslint no-underscore-dangle: 0 */
var debug = require('debug')('qvx:reader');
var xml2js = require('xml2js');
var parser = new xml2js.Parser({explicitArray: false});
var util = require('util');
var Transform = require('stream').Transform;
var LineReader = require('./linereader');

var STATE = {
  Header: 0,
  Data: 1,
  Done: 3,
  Err: -1
};

var VALID_FORMATS = ['array', 'object'];

var Reader = module.exports = function (opt) {
  if (!(this instanceof Reader)) {
    return new Reader(opt);
  }

  opt = opt || {};
  opt.objectFormat = opt.objectFormat || 'array';

  this.options = opt;

  if (VALID_FORMATS.indexOf(opt.objectFormat) === -1) {
    throw new Error('Invalid objectFormat');
  }

  Transform.call(this, {objectMode: true});
  this.state = STATE.Header;
  this.xmlPart = '';
  debug('instanciated Reader');
};

util.inherits(Reader, Transform);

Reader.prototype._transform = function (chunk, enc, done) {
  var self = this;
  if (this.state === STATE.Data) {
    debug('data chunk');
    self._parseLine(chunk);
    done();
  }
  var split = 0;
  for(var i = 0; i < chunk.length; i++) {
    if (this.state === STATE.Header && chunk[i] === 0) {
      debug('got end of xml');
      this.state = STATE.Data;
      this.xmlPart += chunk.toString('utf-8', 0, i);
      split = i;
      parser.parseString(this.xmlPart, readXml);
      break;
    }
  }

  function readXml(err, obj) {
    if (err) {
      throw err;
    }
    self.header = obj;
    self.lineReader = new LineReader(obj, self.options);
    debug('xml header parsed');
    self.emit('header', obj);
    readRest(split);
  }

  function readRest(i) {
    if(self.state === STATE.Data) {
      debug('rest of chunk is data');
      //self.push(chunk.slice(i, chunk.length), enc);
      self._parseLine(chunk.slice(i + 1, chunk.length));
    }
    done();
  }//-readRest
};


Reader.prototype._parseLine = function (buf) {
  debug('parseLine');
  while (!this.lineReader.eof) {
    var line = this.lineReader.parse(buf);
    buf = undefined;
    this.push(line, 'object');
    this.emit('line', line);
    debug('pushed');
  }
};


// Reader.prototype._flush = function (done) {
//   debug('flushing');
//   this.push('');
//   done();
// };
