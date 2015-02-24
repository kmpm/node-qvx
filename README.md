node-qvx
=========
Read and Write Qlik QVX data using Streams

___ALPHA___
## Status
[![Build Status](https://travis-ci.org/kmpm/node-qvx.svg?branch=master)](https://travis-ci.org/kmpm/node-qvx)

Documentation needs to be done but it's still in a quite unstable time
so please have a look at the tests.


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
```bash
qvxcat test\fixtures\test_expressor.qvx

```
This will just print the records as JSON arrays.


Resources
---------
* QVX File Format Specification - http://community.qlik.com/docs/DOC-2677
* QVX Instructions - http://community.qlik.com/docs/DOC-2688
* QVX Libraries and Examples - http://community.qlik.com/docs/DOC-2689