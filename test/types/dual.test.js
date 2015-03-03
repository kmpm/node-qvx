/*eslint new-cap: 0 */
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;


var qvx = require('../../');
var Schema = qvx.Schema;
var Cursor = require('../../lib/extended-cursor');

describe('DualType', function () {

  it('should create proper QvxSpec', function (done) {
    var f = new Schema.Types.Dual('LocalCurrency', {
      whenNull: 'none'
    });

    var expected = {
      FieldName: 'LocalCurrency',
      Type: 'QVX_QV_DUAL',
      Extent: 'QVX_QV_SPECIAL',
      NullRepresentation: 'QVX_NULL_NEVER',
      BigEndian: false,
      CodePage: 65001,
      ByteWidth: 0,
      FieldFormat: {
        Type: 'UNKNOWN',
        Fmt: '',
        nDec: 0,
        UseThou: 0,
        Dec: '',
        Thou: ''
      },
      FixPointDecimals: 0
    };

    var actual = f.toQvxSpec();

    expect(actual).to.deep.eql(expected);
    done();
  });

  it('should read null', function (done) {

    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special'
    });

    var buf = new Buffer([0x00, 0x31, 0x2e, 0x30, 0x39, 0x30, 0x38, 0x00]);
    var cursor = new Cursor(buf);
    var result = f.read(cursor);

    expect(result).to.equal(null);

    var obj = JSON.parse(JSON.stringify(f));
    expect(obj).to.have.property('type', 'Dual');
    done();
  });


  it('should read string', function (done) {

    var f = Schema.Types.Dual('DualTest', {
      bytes: 1,
      field: 'dual', extent: 'special', format: {thouSep: ' '}
    });

    var buf = new Buffer([0x04, 0x31, 0x2e, 0x30, 0x39, 0x30, 0x38, 0x00]);
    var cursor = new Cursor(buf);
    var result = f.read(cursor);
    expect(result).to.equal('1.0908');
    var obj = JSON.parse(JSON.stringify(f));
    expect(obj).to.have.property('type', 'Dual');

    done();
  });


  it('should read double', function (done) {

    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special'
    });

    var buf = new Buffer([0x02, 0xf9, 0xa0, 0x67, 0xb3, 0xea, 0x73, 0xf1, 0x3f]);
    var cursor = new Cursor(buf);
    var result = f.read(cursor);
    expect(result).to.equal(1.0908);
    done();
  });

  it('should read double and string', function (done) {

    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special'
    });

    var buf = new Buffer([0x06, 0xf9, 0xa0, 0x67, 0xb3, 0xea, 0x73, 0xf1, 0x3f,
      0x31, 0x2e, 0x30, 0x39, 0x30, 0x38, 0x00]);
    var cursor = new Cursor(buf);
    var result = f.read(cursor);
    expect(result).to.equal(1.0908);
    var obj = JSON.parse(JSON.stringify(f));
    expect(obj).to.have.property('type', 'Dual');
    done();
  });


  it('should write null as null', function (done) {
    var expected = new Buffer([0x00]);

    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special'
    });

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, null);

    expect(cursor.tell(), 'bad length written').to.equal(expected.length);

    buf = cursor.buffer.slice(0, cursor.tell());
    expect(buf).to.eql(expected);

    done();
  });


  it('should write decimal double', function (done) {
    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special'
    });

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 1.0908);

    expect(cursor.tell(), 'bad length written').to.equal(9);
    buf = cursor.buffer.slice(0, cursor.tell());
    var expected = new Buffer([0x02, 0xf9, 0xa0, 0x67, 0xb3, 0xea, 0x73, 0xf1, 0x3f]);
    expect(buf).to.eql(expected);
    done();
  });

  it('should write BE decimal double', function (done) {
    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special', endian: 'big'
    });

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 1.0908);

    expect(cursor.tell(), 'bad length written').to.equal(9);
    buf = cursor.buffer.slice(0, cursor.tell());
    var expected = new Buffer([0x02, 0x3f, 0xf1, 0x73, 0xea, 0xb3, 0x67, 0xa0, 0xf9]);
    expect(buf).to.eql(expected);
    done();
  });

  it('should write decimal string as double and string', function (done) {
    var expected = new Buffer([0x06, 0xf9, 0xa0, 0x67, 0xb3, 0xea, 0x73, 0xf1, 0x3f,
      0x31, 0x2e, 0x30, 0x39, 0x30, 0x38, 0x00]);

    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special'
    });

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, '1.0908');

    expect(cursor.tell(), 'bad length written').to.equal(expected.length);

    buf = cursor.buffer.slice(0, cursor.tell());
    expect(buf).to.eql(expected);

    done();
  });


  it('should write decimal string as BE double and string', function (done) {
    var expected = new Buffer([0x06, 0x3f, 0xf1, 0x73, 0xea, 0xb3, 0x67, 0xa0, 0xf9,
      0x31, 0x2e, 0x30, 0x39, 0x30, 0x38, 0x00]);

    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special', endian: 'big'
    });

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, '1.0908');

    expect(cursor.tell(), 'bad length written').to.equal(expected.length);

    buf = cursor.buffer.slice(0, cursor.tell());
    expect(buf).to.eql(expected);

    done();
  });


  it('should write string as string', function (done) {
    var expected = new Buffer([0x04, 0x41, 0x31, 0x2e, 0x30, 0x39, 0x30, 0x38, 0x00]);

    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special'
    });

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 'A1.0908');

    expect(cursor.tell(), 'bad length written').to.equal(expected.length);

    buf = cursor.buffer.slice(0, cursor.tell());
    expect(buf).to.eql(expected);

    done();
  });

  it('should write INT ad double', function (done) {
    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special'
    });

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 10);
    buf = cursor.buffer.slice(0, cursor.tell());
    var expected = new Buffer([0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x24, 0x40]);
    expect(buf).to.eql(expected);
    // expect(fn).to.throw(Error, 'No int yet');
    // function fn() {
    //   f.write(cursor, 10);
    // }
    done();
  });


  it('should throw on undefined value', function (done) {
    var f = new Schema.Types.Dual('DualTest', {
      field: 'dual', extent: 'special'
    });
    var v;
    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    expect(fn).to.throw(TypeError, 'No value to write');
    function fn() {
      f.write(cursor, v);
    }
    done();
  });

});
