var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;

var qvx = require('../../');
var Schema = qvx.Schema;
var Cursor = require('../../lib/extended-cursor');

var bignum = require('bignum');

describe('Number.Bcd', function () {

  it('should do', function (done) {
    var f = new Schema.Types.Number('Margin', {
        field: 'bcd', bytes: 18, decimals: 4, extent: 'fix'
    });

    expect(f).to.include({
      wireFormat: 'Bcd'
    });

    expect(f).to.be.instanceof(Schema.Types.Number);
    done();
  });

  it('should read with decimals', function (done) {
    var buf = new Buffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x10, 0x10, 0x10]);
    var cursor = new Cursor(buf);

    var f = new Schema.Types.Number('Margin', {
        field: 'bcd', bytes: 8, decimals: 4, extent: 'fix'
    });

    var result = f.read(cursor);

    expect(result).to.equal(1234.5678);
    done();
  });


  it('should read without decimals', function (done) {
    var buf = new Buffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x10, 0x10, 0x10]);
    var cursor = new Cursor(buf);

    var f = new Schema.Types.Number('Margin', {
        field: 'bcd', bytes: 8, extent: 'fix'
    });

    var result = f.read(cursor);

    expect(result).to.equal(12345678);
    done();
  });


  it('should fail if read to much', function (done) {
    var buf = new Buffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x10, 0x10, 0x10]);
    var cursor = new Cursor(buf);

    var f = new Schema.Types.Number('Margin', {
        field: 'bcd', bytes: 18, decimals: 4, extent: 'fix'
    });

    expect(fn).to.throw(Error);
    function fn() {
      f.read(cursor);
    }

    done();
  });


  it('should write without decimals', function (done) {
    var buf = new Buffer(30);
    var cursor = new Cursor(buf);

    var f = new Schema.Types.Number('Margin', {
        field: 'bcd', bytes: 18, decimals: 0, extent: 'fix'
    });

    var result = f.write(cursor, 12345678);
    var expected = new Buffer([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
    buf = buf.slice(0, cursor.tell());

    expect(buf).to.eql(expected);
    done();
  });
});
