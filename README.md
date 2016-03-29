node-qvx
=========
Read and Write Qlik QVX data using Streams

## Status
[![Build Status](https://travis-ci.org/kmpm/node-qvx.svg?branch=master)](https://travis-ci.org/kmpm/node-qvx)

Documentation needs to so please have a look at the tests.

Have a look at https://github.com/kmpm/node-qvxserver for a Hapi based webserver that will give you qvx data.

Installation
------------

    npm install

There is a dependency on a module called bignum that uses some native SSL libraries
for handling 64 bit integers. This dependency might be tricky to install in windows.
Go to https://slproweb.com/products/Win32OpenSSL.html and download the latest __full__
version of OpenSLL and install it to it's default location. That might help.

Examples
---------
### Outbound
Have a look at https://github.com/kmpm/node-qvxserver for a 
Hapi based webserver that will give you qvx data that for example
QlikView can read. Also look at tests/outbound.tests.js and test/schema.tests.js.

Since the process is quit simple but quite verbos it's not suitable for the readme 
but you basically do.

1. Create a field definition with datatypes
2. Create a resuable schema instance using these field definitions 
3. From a stream of objects that match the field definition, pipe through
   the schema instance.


### Inbound
This shows a use of Inbound, something that you would do if you needed
to read qvx data from somewhere. It's used internally for testing and 
validation.

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