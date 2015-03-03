/*eslint new-cap: 0 */
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;


var qvx = require('../../');
var Schema = qvx.Schema;
var Cursor = require('../../lib/extended-cursor');

function cursorWithDate(datestring) {

  var buf = new Buffer(30);
  var cursor = new Cursor(buf);

  var ds = typeof datestring === 'undefined' ? '2010-12-12 11:12:13' : datestring;

  cursor.writeUInt8(ds.length);
  cursor.writeString(ds, ds.length, 'utf-8');
  cursor.seek(0);
  return cursor;
}

describe('DateType', function () {
  it('should do', function (done) {
    var f = new Schema.Types.Date('InvoiceDate');

    expect(f)
    .to.be.instanceof(qvx.Schema.Types.Date)
    .to.include({
      name: 'InvoiceDate',
      field: 'text',
      bytes: 1,
      endian: 'little',
      extent: 'counted',
      whenNull: 'supress',
      encoding: 'utf-8',
      wireFormat: 'String'
    })
    .to.have.property('format')
    .to.include({
      type: 'TIMESTAMP',
      fmt: 'YYYY-MM-DD HH:mm:ss'
    })
    .to.not.have.keys('nDec', 'Dec', 'Thou', 'UseThou');
    // console.log(schema.fields.InvoiceDate);
    done();
  });


  it('should read', function (done) {
    var f = Schema.Types.Date('InvoiceDate', {type: 'Date'});
    var cursor = cursorWithDate();
    var result = f.read(cursor);
    expect(result).to.be.instanceof(Date);
    done();
  });


  it('should read without format', function (done) {
    var f = Schema.Types.Date('InvoiceDate', {type: 'Date', format: {fmt: ''}});
    var cursor = cursorWithDate();
    var result = f.read(cursor);
    expect(result).to.be.instanceof(Date);
    done();
  });


  it('should read empty string as null', function (done) {
    var f = Schema.Types.Date('InvoiceDate');
    var cursor = cursorWithDate('');
    var result = f.read(cursor);
    expect(result).to.equal(null);
    done();
  });

  it('should read short string as null', function (done) {
    var f = Schema.Types.Date('InvoiceDate');
    var cursor = cursorWithDate('2015');
    var result = f.read(cursor);
    expect(result).to.equal(null);
    done();
  });

  it('should read with timezone', function (done) {
    var f = Schema.Types.Date('InvoiceDate', {type: 'Date', timezone: 'Asia/Jakarta'});
    var cursor = cursorWithDate();
    var result = f.read(cursor);
    expect(result).to.be.instanceof(Date);
    expect(result.toISOString()).to.not.equal('2010-12-12T10:12:13.000Z');
    expect(result.toISOString()).to.equal('2010-12-12T04:12:13.000Z');
    done();
  })
});
