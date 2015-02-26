var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;


var qvx = require('../../');
var Schema = qvx.Schema;
var Cursor = require('../../lib/extended-cursor');

describe('StringType', function () {

  it('should do (ItemDesc)', function (done) {
    var f = Schema.Types.String('ItemDesc');

    expect(f).to.include({
      wireFormat: 'String'
    });

    var spec = f.toQvxSpec();
    expect(spec).to.include({
      FieldName: 'ItemDesc',
      Type: 'QVX_TEXT',
      Extent: 'QVX_COUNTED',
      NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
      BigEndian: false,
      CodePage: 65001,
      ByteWidth: 4
    })
    .to.not.have.property('FixPointDecimals');
    done();
  });

  it('should read fixed', function (done) {
    var f = new Schema.Types.String('StringTest', {
      extent: 'fix', bytes: 3
    });

    var buf = new Buffer([0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48]);
    var cursor = new Cursor(buf);
    var result = f.read(cursor);
    expect(result).to.equal('ABC');
    done();
  });


  it('should error on read with bad extent', function (done) {
    var f = new Schema.Types.String('StringTest', {
      extent: 'fixer', bytes: 3
    });

    var buf = new Buffer([0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48]);
    var cursor = new Cursor(buf);
    expect(fn).to.throw(Error);

    function fn() {
      f.read(cursor);
    }

    done();
  });


  it('should read counted', function (done) {
    var f = new Schema.Types.String('StringTest', {bytes: 1});

    var buf = new Buffer([0x04, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48]);
    var cursor = new Cursor(buf);
    var result = f.read(cursor);
    expect(result).to.equal('ABCD');
    done();
  });

  it('should read zero', function (done) {
    var f = new Schema.Types.String('StringTest', {bytes: 1, extent: 'zero'});

    var buf = new Buffer([0x41, 0x42, 0x00, 0x44, 0x45, 0x46, 0x47, 0x48]);
    var cursor = new Cursor(buf);
    var result = f.read(cursor);
    expect(result).to.equal('AB');
    done();
  });


  it('should write fixed', function (done) {
    var expected = new Buffer([0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48]);

    var f = new Schema.Types.String('StringTest', {
      extent: 'fix', bytes: 8
    });

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 'ABCDEFGH');

    expect(cursor.tell(), 'bad length written').to.equal(8);

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


  it('should zero fill on long fixed string', function (done) {
    var expected = new Buffer([0x41, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

    var f = new Schema.Types.String('StringTest', {extent: 'fix', bytes: 10});

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, 'AB');

    expect(cursor.tell(), 'bad length written').to.equal(expected.length);

    buf = cursor.buffer.slice(0, cursor.tell());
    expect(buf).to.eql(expected);

    done();
  });


  it('should throw on to big fix string', function (done) {

    var f = new Schema.Types.String('StringTest', {extent: 'fix', bytes: 3});

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);

    expect(fn).to.throw(Error)
    function fn() {
      f.write(cursor, 'ABCD');
    }
    done();
  });


  it('should write object with toString', function (done) {

    var f = new Schema.Types.String('StringTest', {extent: 'fix', bytes: 30});

    var buf = new Buffer(30);
    var cursor = new Cursor(buf);
    f.write(cursor, new Schema.Types.String('asdf'));

    cursor.seek(0);
    var result = cursor.readZeroString();
    expect(result).to.equal('[object Object]');

    done();
  });

});
