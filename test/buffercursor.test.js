var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('chai').expect;


var BufferCursor = require('../lib/mybuffercursor');



lab.experiment('BufferCursor', function () {

  lab.test('readUInt', function (done) {
    var buff = new Buffer([4, 65, 66, 67, 68]);
    var bc = new BufferCursor(buff);

    expect(bc).to.have.property('readUInt');
    var size = bc.readUInt(1, 'BE');
    expect(size).to.equal(4);
    done();
  })

});