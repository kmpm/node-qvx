var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;

var fs = require('fs');
var path = require('path');

var qvx = require('..');
var Schema = qvx.Schema;


describe('Schema', function () {

  it('should include creator', function (done) {
    var schema = new Schema({}, {creator: true});
    var spec = schema.toQvxSpec();
    expect(spec).to.have.property('Creator');
    done();
  });

  it('should throw on adding a field with bad type', function (done) {
    var schema = new Schema({}, {creator: true});
    schema.toQvxSpec();

    expect(fn).to.throw(TypeError, 'Undefined type `Monkey` at `Testing`');
    function fn() {
      schema.add({Testing: {type: 'monkey'}});
    }
    done();
  });

  it('should add with native type', function (done) {
    var schema = new Schema({}, {creator: true});
    schema.toQvxSpec();
    schema.add({Testing: {type: String}});
    expect(schema.fields).to.have.length(1);
    done();
  });

  it('should add with direct type', function (done) {
    var schema = new Schema({}, {creator: true});
    schema.toQvxSpec();
    schema.add({Testing: String});
    expect(schema.fields).to.have.length(1);
    done();
  });


  describe('Types', function () {
    it('should throw on bad field in toQvxSpec', function (done) {
      var f = new Schema.Types.String('Testname', {});
      f.field = 'asdf';
      expect(f.field).to.equal('asdf');
      expect(fn).to.throw(TypeError);

      function fn() {
        f.toQvxSpec();
      }
      done();
    });

    it('should encode utf-16', function (done) {
      var f = new Schema.Types.String('Testname', {encoding: 'utf-16'});
      var spec = f.toQvxSpec();
      expect(spec).to.have.property('CodePage', 12001);
      done();
    });

    it('should exclude format.fmt if undefined', function (done) {
      var f = new Schema.Types.String('Testname', {format: {}});
      var spec = f.toQvxSpec();
      expect(spec).to.have.property('FieldFormat')
      .to.not.have.property('Fmt');
      done();
    });
  });//-types


  describe('toQvx', function () {

    it('should do without opts', function (done) {
      var fields = {
        'AddressNumber': {type: Number},
        'ItemNumber': {type: Number, field: 'signed', bytes: 8, decimals: 0}
      };

      var schema = new qvx.Schema(fields, {
        createdAt: '2012-03-06 19:22:15',
        creator: false,
        tableName: 'test'
      });

      var x = schema.toQvx();
      expect(x).to.equal(fs.readFileSync(path.join(__dirname, 'fixtures', 'short.schema.xml'), 'utf-8'));
      done();
    });


    it('should do pretty schema', function (done) {
      var fields = {
        'AddressNumber': {type: Number},
        'ItemNumber': {type: Number, field: 'signed', bytes: 8, decimals: 0}
      };

      var schema = new qvx.Schema(fields, {
        createdAt: '2012-03-06 19:22:15',
        creator: false
      });

      var x = schema.toQvx({pretty: true});
      expect(x).to.equal(fs.readFileSync(path.join(__dirname, 'fixtures', 'short.pretty.schema.xml'), 'utf-8'));
      done();
    });
  });//--toQvx


  describe('fromQvx', function () {

    it('should suppor test_expressor', function (done) {
      var e = require('./fixtures/test_expressor_header.json');
      var schema = Schema.fromQvx(e);

      var margin = schema.fields[15];
      expect(margin).to.deep.include({
        name: 'Margin',
        field: 'bcd',
        decimals: 4,
        bytes: 18,
        endian: 'little',
        extent: 'fix',
        whenNull: 'supress',
        encoding: 'utf-8'
      });


      var itemDesc = schema.fields[7];
      expect(itemDesc).to.deep.include({
        name: 'ItemDesc',
        field: 'text',
        bytes: 4,
        endian: 'little',
        extent: 'counted',
        whenNull: 'supress',
        encoding: 'utf-8'
      });

      expect(itemDesc).to.be.instanceof(qvx.Schema.Types.String);
      expect(itemDesc).to.have.property('type', 'String');


      var invoiceDate = schema.fields[2];
      expect(invoiceDate).to.include({
        name: 'InvoiceDate',
        field: 'text',
        bytes: 1,
        endian: 'little',
        extent: 'counted',
        whenNull: 'supress',
        encoding: 'utf-8'
      })
      .to.have.property('format')
      .to.include({
        fmt: 'YYYY-MM-DD HH:mm:ss',
        type: 'TIMESTAMP'
      });

      expect(schema.fields).to.have.length(19);
      //console.log('asdf %j', schema);
      done();
    });

  });
});
