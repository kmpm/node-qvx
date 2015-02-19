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


var Reader = module.exports = function (opt) {
  if (!(this instanceof Reader)) {
    return new Reader(opt);
  }
  Transform.call(this, opt);
  this.state = STATE.Header;
  this.xmlPart = '';
  this.dataPart = new Buffer('');
  debug('instanciated Reader');
};

util.inherits(Reader, Transform);

Reader.prototype._transform = function (chunk, enc, done) {
  var self = this;
  if (this.state === STATE.Data) {
    debug('data chunk');
    self.dataPart = Buffer.concat([self.dataPart, chunk]);
    self._parseLine();
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
    self.lineReader = new LineReader(obj);
    debug('xml header parsed');
    self.emit('header', obj);
    readRest(split);
  }

  function readRest(i) {
    if(self.state === STATE.Data) {
      debug('rest of chunk is data');
      self.dataPart = Buffer.concat([self.dataPart, chunk.slice(i + 1, chunk.length)]);
      //self.push(chunk.slice(i, chunk.length), enc);
      self._parseLine();
    }
    done();
  }//-readRest
};

Reader.prototype._parseLine = function () {
  debug('parseLine');
  this.push(JSON.stringify(this.lineReader.parse(this.dataPart)), 'buffer');
};


Reader.prototype._flush = function (done) {
  debug('flushing');
  this.push('');
  done();
};
