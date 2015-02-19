var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = require('code').expect;


var BufferCursor = require('../lib/mybuffercursor');



lab.experiment('BufferCursor', function () {

  lab.test('readUInt', function (done) {
    var buff = new Buffer([4, 65, 66, 67, 68]);
    var bc = new BufferCursor(buff);

    expect(bc.readUInt).to.be.a.function();
    var size = bc.readUInt(1, 'BE');
    expect(size).to.equal(4);
    done();
  });


  lab.test('peekByte', function (done) {
    var buff = new Buffer([4, 65, 66, 67, 68]);
    var bc = new BufferCursor(buff);
    bc.seek(3);
    expect(bc.peekByte()).to.equal(67);
    expect(bc.tell()).to.equal(3);
    done();
  });

});
