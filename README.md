node-qvx
=========
Read and Write Qlik QVX data using Streams

## Status
[![Build Status](https://travis-ci.org/kmpm/node-qvx.svg?branch=master)](https://travis-ci.org/kmpm/node-qvx)

Documentation needs to be done but it's still in a quite unstable time
so please have a look at the tests.

Have a look at https://github.com/kmpm/node-qvxserver for a Hapi based webserver that will give you qvx data.

Installation
------------

    npm install

There is a dependency on a module called bignum that uses some native SSL libraries
for handling 64 bit integers. This dependency might be tricky to install in windows.
Go to https://slproweb.com/products/Win32OpenSSL.html and download the latest __full__
version of OpenSLL and install it to it's default location.

Examples
---------
This is sort of a pointless thing to do but it shows a use of Inbound.

```javascript

var concat = require('concat-stream');
var JSONStream = require('JSONStream');
var fs = require('fs');

var qvx = require('qvx');

var inbound = new qvx.Inbound({recordFormat: 'object'});
var fileStream = fs.createReadStream('test_expressor.qvx');
var stringify = JSONStream.stringify(false);

fileStream
.pipe(inbound)
.pipe(stringify)
.pipe(concat(function (body) {
  console.log(body);
}));

```

There is currently also a cli that is really quick and dirty.
It just takes a qvx as input and outputs the records as arrays.

```bash
qvxcat test/fixtures/test_expressor.qvx

```
This will just print the records as JSON arrays.


Resources
---------
* QVX File Format Specification - http://community.qlik.com/docs/DOC-2677
* QVX Instructions - http://community.qlik.com/docs/DOC-2688
* QVX Libraries and Examples - http://community.qlik.com/docs/DOC-2689
* Qlik QVX SDK https://help.qlik.com/sense/en-US/developer/#../Subsystems/QVXSDKAPI/Content/Introducing QVX.htm