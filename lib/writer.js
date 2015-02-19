/*eslint capIsNewExceptions: [Element] */
var xml2js = require('xml2js');




function utcNow () {
  var d = (new Date()).toISOString().replace('T', ' ');
  return d.substr(0, d.indexOf('.'));
}


/*
 * Write stuff to qvx
 */
var Writer = module.exports = function () {

};


Writer.write = function (header) {
  var builder = new xml2js.Builder();
  //writer.write('<?xml version="1.0" encoding="utf-8"?>');

  // var tableHeader = {
  //   MajorVersion: 1,
  //   MinorVersion: 0,
  //   CreateUtcTime: data.created || utcNow(),
  //   TableName: data.tableName || 'table',

  //   Creator: {
  //     Company: data.company || 'node.js',
  //     Product: data.product || 'node-qvx'
  //   }
  // };

  var xml = builder.buildObject(header);
  return xml;
};
