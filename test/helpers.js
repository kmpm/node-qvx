/*eslint no-unused-expressions: [0, ["exist"]]*/
var util = require('util');
var expect = require('chai').expect;
var xml2js = require('xml2js');
var parser = new xml2js.Parser({explicitArray: false});
var debug = require('debug')('qvx:test:helpers');


exports.splitQvx = function (data) {
  if (!(data instanceof Buffer)) {
    data = new Buffer(data);
  }
  var pos = 0;
  var xml = '';
  while(data.readUInt8(pos++) !== 0) {
    xml = data.toString('utf-8', 0, pos);
  }
  data = data.slice(pos);
  return {xml: xml, data: data};
};


exports.equalBuffer = function (expected, actual, start) {
  start = start || 0;
  for (var i = start; i < expected.length; i++) {
    var e = expected.toString('hex', i, i + 1);
    var a = actual.toString('hex', i, i + 1);
    var msg = util.format('offset %s', i.toString(16));
    expect(a, msg).to.equal(e);
  }
};

exports.equalXmlHeader = function (expected, actual, callback) {
  parser.parseString(expected, function (err, objExpected) {
    if (err) {
      throw err;
    }
    parser.parseString(actual, function (err, objActual) {
      if (err) {
        throw err;
      }
      equalDeep(objExpected, objActual);
      callback();
    });
  });
};


var equalDeep = exports.equalDeep = function (expected, actual, path) {
  path = path || 'root';
  var np = path;
  function dp (a, b) {
    return a + '.' + b;
  }

  for (var key in expected) {
    if (expected.hasOwnProperty(key)) {
      debug('looking at %s in %s', key, path);
      if (actual instanceof Array) {
        expect(actual[key]).to.exist;
      }
      else {
        // debug('actual', actual);
        // debug('expected', expected);
        expect(actual, path).to.have.property(key);
      }
      var a = actual[key];
      var e = expected[key];
      // debug('key=%s, in %s. Value=%s, typeE=%s, typeA=%s', key, path, a, typeof e, typeof a);
      if (e instanceof Buffer) {
        debug('was buffer');
        expect(a, 'not matching length of ' + dp(np, key))
        .to.have.length(e.length);

        expect(a.toString('hex'), 'buffer not same in ' + dp(np, key))
        .to.equal(e.toString('hex'));
      }
      else if (typeof e === 'object') {
        debug('was object');
        equalDeep(e, a, dp(np, key));
      }
      else {
        expect(a, dp(np, key)).to.equal(e);
        // if (key !== 'name') {
        //   var atype = typeof a;
        //   if (atype === 'undefined') {
        //     expect(atype).to.equal(typeof e);
        //   }
        //   else {
        //     //don't test getters

        //     var prop = Object.getOwnPropertyDescriptor(actual, key);
        //     if (!prop.get) {
        //       expect(a, util.format('%s (%s) is not as expected',
        //         dp(np, key), atype)).to.equal(e);
        //     }
        //   }
        // }
        // else {
          // expect(a, util.format('wrong length of %s', dp(np, key)))
          // .to.have.length(e.length);
          // debug('actual: %s, expected: %s', a, e);
        // }
      }
    }
  }
};
