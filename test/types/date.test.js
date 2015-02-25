var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var describe = lab.experiment;
var it = lab.test;


var qvx = require('../../');
var Schema = qvx.Schema;
var Cursor = require('../../lib/extended-cursor');

function cursorWithDate() {
  var buf = new Buffer(30);
  var cursor = new Cursor(buf);

  var ds = '2010-12-12 11:12:13';

  cursor.writeUInt8(ds.length);
  cursor.writeString(ds, ds.length, 'utf-8');
  cursor.seek(0);
  return cursor;
}

describe('DateType', function () {
  it('should do', function (done) {
    var f = new Schema.Types.Date('InvoiceDate', {type: 'Date'});

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
    });
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

});