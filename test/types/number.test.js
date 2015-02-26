var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;

var qvx = require('../../');
var Schema = qvx.Schema;
var Cursor = require('../../lib/extended-cursor');

var bignum = require('bignum');

describe('NumberType', function () {
  describe('DoubleLE', function () {

    it('DoubleLE should do (AddressNumber)', function (done) {
      var f = Schema.Types.Number('AddressNumber', {});

      expect(f).to.be.instanceof(qvx.Schema.Types.Number)
      .to.include({
        type: 'Number',
        wireFormat: 'DoubleLE'
      });

      var addrSpec = f.toQvxSpec();
      expect(addrSpec).to.include({
        FieldName: 'AddressNumber',
        Type: 'QVX_IEEE_REAL',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 8
      });
      done();
    });
  });//--DoubleLE


  describe('Float', function () {

    it('should have FloatBE', function (done) {
      var f = Schema.Types.Number('AddressNumber', {bytes: 4, endian: 'big'});

      expect(f).to.be.instanceof(Schema.Types.Number)
      .to.include({
        type: 'Number',
        wireFormat: 'FloatBE'
      });

      var addrSpec = f.toQvxSpec();
      expect(addrSpec).to.include({
        FieldName: 'AddressNumber',
        Type: 'QVX_IEEE_REAL',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: true,
        CodePage: 65000,
        ByteWidth: 4
      });
      done();
    });
  });//--float


  describe('Int64BE', function () {
    it('should do (ItemNumber)', function (done) {
      var f = new Schema.Types.Number('ItemNumber', {field: 'signed', bytes: 8, decimals: 0, endian: 'big'});

      expect(f).to.include({
        wireFormat: 'Int64BE'
      });

      var spec = f.toQvxSpec();
      expect(spec).to.include({
        FieldName: 'ItemNumber',
        Type: 'QVX_SIGNED_INTEGER',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: true,
        CodePage: 65000,
        ByteWidth: 8,
        FixPointDecimals: 0
      });

      done();
    });


    it('should read 64-bit bignum', function (done) {
      var buf = new Buffer([0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
      var cursor = new Cursor(buf);
      var f = new Schema.Types.Number('ItemNumber', {field: 'signed', bytes: 8, decimals: 0, endian: 'big'});
      var result = f.read(cursor);
      expect(result).to.be.instanceof(bignum);
      expect(result.bitLength()).to.equal(63);
      expect(result.toString()).to.equal('9223372036854775807');

      expect(fn).to.throw(Error);
      function fn(){
        f.read(Date);
      }

      done();
    });


    it('should read bignum into normal Number', function (done) {
      var buf = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF]);
      var cursor = new Cursor(buf);
      var f = new Schema.Types.Number('ItemNumber', {field: 'signed', bytes: 8, decimals: 0, endian: 'big'});
      var result = f.read(cursor);
      expect(result).to.be.a('number');
      expect(result).to.equal(16777215);

      expect(fn).to.throw(Error);
      function fn(){
        f.read(Date);
      }

      done();
    });

  });//--Int64BE

  describe('Int64LE', function () {

    it('should do (ItemNumber)', function (done) {
      var f = new Schema.Types.Number('ItemNumber', {field: 'signed', bytes: 8, decimals: 0});

      expect(f).to.include({
        wireFormat: 'Int64LE'
      });

      var spec = f.toQvxSpec();
      expect(spec).to.include({
        FieldName: 'ItemNumber',
        Type: 'QVX_SIGNED_INTEGER',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 8,
        FixPointDecimals: 0
      });

      done();
    });

    it('should read', function (done) {
      var buf = new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F]);
      var cursor = new Cursor(buf);
      var f = new Schema.Types.Number('ItemNumber', {field: 'signed', bytes: 8, decimals: 0});
      var result = f.read(cursor);
      expect(result).to.be.instanceof(bignum);
      expect(result.toString()).to.eql('9223372036854775807');
      expect(result.bitLength()).to.equal(63);

      expect(fn).to.throw(Error);
      function fn(){
        f.read(Date);
      }

      done();
    });

    it('should write', function (done) {

      var expected = new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F]);
      var f = new Schema.Types.Number('ItemNumber', {field: 'signed', bytes: 8, decimals: 0});

      var buf = new Buffer(30);
      var cursor = new Cursor(buf);
      f.write(cursor, bignum('9223372036854775807'));

      expect(cursor.tell()).to.equal(expected.length);

      buf = buf.slice(0, cursor.tell());

      expect(buf).to.eql(expected);
      done();
    });
  });//--Int64LE


  describe('UInt64LE', {skip: true}, function () {

    it('should do ', function (done) {
      var f = new Schema.Types.Number('ItemNumber', {field: 'unsigned', bytes: 8});

      expect(f).to.include({
        wireFormat: 'UInt64LE'
      });

      var spec = f.toQvxSpec();
      expect(spec).to.include({
        FieldName: 'ItemNumber',
        Type: 'QVX_UNSIGNED_INTEGER',
        Extent: 'QVX_FIX',
        NullRepresentation: 'QVX_NULL_FLAG_SUPPRESS_DATA',
        BigEndian: false,
        CodePage: 65001,
        ByteWidth: 8
      });

      done();
    });

    it('should read', function (done) {
      var buf = new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F]);
      var cursor = new Cursor(buf);
      var f = new Schema.Types.Number('ItemNumber', {field: 'unsigned', bytes: 8});
      var result = f.read(cursor);
      expect(result).to.be.instanceof(bignum);
      expect(result.toString()).to.eql('9223372036854775807');
      expect(result.bitLength()).to.equal(63);

      expect(fn).to.throw(Error);
      function fn(){
        f.read(Date);
      }

      done();
    });

    it('should write', function (done) {

      var expected = new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F]);
      var f = new Schema.Types.Number('ItemNumber', {field: 'unsigned', bytes: 8, decimals: 0});

      var buf = new Buffer(30);
      var cursor = new Cursor(buf);
      f.write(cursor, bignum('9223372036854775807'));

      expect(cursor.tell()).to.equal(expected.length);

      buf = buf.slice(0, cursor.tell());

      expect(buf).to.eql(expected);
      done();
    });

  });//--UInt64LE


  describe('Int32BE', function () {

    it('should read', function (done) {
      var buf = new Buffer([0x7F, 0xFF, 0xFF, 0xFF]);
      var cursor = new Cursor(buf);
      var f = new Schema.Types.Number('ItemNumber', {field: 'signed', bytes: 4, decimals: 0, endian: 'big'});
      var result = f.read(cursor);
      expect(result).to.be.a('number');
      expect(result).to.equal(2147483647);

      expect(fn).to.throw(Error);
      function fn(){
        f.read(Date);
      }

      done();
    });
  });//--Int32BE
});
