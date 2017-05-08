var fs = require('fs');
var minify = require('minify');
var pkg = require('./package.json');

var src = './lib/RemoteSerialPort.js';
var dst = './dist/RemoteSerialPort.min.js';

minify(src, function(error, data) {
  if (error) return console.error(error);
  var comment = "/*! RemoteSerialPort v" + pkg.version + " | https://github.com/papnkukn/remote-serial-port-client | MIT license */\n";
  var js = comment + data;
  fs.writeFileSync(dst, js);
  console.log("Done!");
});