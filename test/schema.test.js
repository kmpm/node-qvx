var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;
var debug = require('debug')('qvx:test:schema');

var fs = require('fs');
var path = require('path');
var ExtendedCursor = require('../lib/extendedcursor');

var Schema = require('../lib/schema');

var EXPRESSOR_BIN_FILE = path.join(__dirname, 'fixtures', 'test_expressor.bin');


lab.experiment('Schema from qvx', function () {
  lab.test('expressor', function (done) {
    var e = require('./fixtures/test_expressor_header.json');

    var schema = Schema.fromQvx(e);
    expect(schema).to.have.property('tableName', 'test');
    expect(schema).to.have.property('useSeparator', true);
    expect(schema.fields).to.have.length(19);

    var bc = new ExtendedCursor(fs.readFileSync(EXPRESSOR_BIN_FILE))
    var recCount = 0;

    var inbound = schema.bindReadCursor(bc);
    var rec = inbound.readRecord();
    expect(rec).to.be.instanceof(Array);
    expect(rec).to.have.length(19);
    recCount++;

    while (!inbound.eof()) {
        rec = inbound.readRecord();
        recCount++;
    }
    expect(recCount).to.equal(120);

    done();
  });
});
