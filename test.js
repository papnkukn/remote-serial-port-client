var RemoteSerialPort = require("./lib/RemoteSerialPort.js");

//List serial port names
var serialport = new RemoteSerialPort({ url: "http://localhost:5147/" });
serialport.list(function(error, ports) {
  if (error) return console.error(error);
  console.log("Serial ports:");
  for (var i = 0; i < ports.length; i++) {
    console.log("  " + ports[i].comName);
  }
  for (var i = 0; i < ports.length; i++) {
    console.log(ports[i]);
  }
});