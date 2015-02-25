var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;


var qvx = require('../../');
var Schema = qvx.Schema;
var Cursor = require('../../lib/extended-cursor');

describe('String', function () {


  it('should write fixed', function (done) {
    var expected = new Buffer([0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48]);

    var f = new Schema.Types.String('StringTest', {
      extent: 'fix', bytes: 8
    });

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 'ABCDEFGH');

    expect(cursor.tell(), 'bad length written').to.equal(expected.length);

    buf = cursor.buffer.slice(0, cursor.tell());
    expect(buf).to.eql(expected);

    done();
  });


  it('should write counted LE', function (done) {
    var expected = new Buffer([0x08, 0x00, 0x00, 0x00, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48]);

    var f = new Schema.Types.String('StringTest', {});

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 'ABCDEFGH');

    expect(cursor.tell(), 'bad length written').to.equal(expected.length);

    buf = cursor.buffer.slice(0, cursor.tell());
    expect(buf).to.eql(expected);

    done();
  });


  it('should write counted BE', function (done) {
    var expected = new Buffer([0x00, 0x00, 0x00, 0x08, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48]);

    var f = new Schema.Types.String('StringTest', {endian: 'big'});

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 'ABCDEFGH');

    expect(cursor.tell(), 'bad length written').to.equal(expected.length);

    buf = cursor.buffer.slice(0, cursor.tell());
    expect(buf).to.eql(expected);

    done();
  });


  it('should write zero', function (done) {
    var expected = new Buffer([0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x00]);

    var f = new Schema.Types.String('StringTest', {extent: 'zero'});

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 'ABCDEFGH');

    expect(cursor.tell(), 'bad length written').to.equal(expected.length);

    buf = cursor.buffer.slice(0, cursor.tell());
    expect(buf).to.eql(expected);

    done();
  });

});