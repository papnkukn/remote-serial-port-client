var RemoteSerialPort = require("../lib/RemoteSerialPort.js");

exports["constructor"] = function(test) {
  try {
    new RemoteSerialPort();
    test.ok(false, "Expected to throw exception on missing argument");
  }
  catch (error) {
    test.ok(true);
  }
  
  try {
    new RemoteSerialPort({ mode: "http", host: "localhost" });
    test.ok(false, "Expected to throw exception on missing 'url' argument");
  }
  catch (error) {
    test.ok(true);
  }
  
  try {
    new RemoteSerialPort({ url: "http://localhost:5147/" });
    test.ok(true);
  }
  catch (error) {
    test.ok(false, error);
  }
  
  try {
    new RemoteSerialPort({ mode: "udp", host: "127.0.0.1" });
    test.ok(true);
  }
  catch (error) {
    test.ok(false, error);
  }
  
  test.done();
};

exports["list"] = function(test) {
  //List serial port names
  var serialport = new RemoteSerialPort({ url: "http://localhost:5147/" });
  serialport.list(function(error, ports) {
    if (error) {
      test.ok(false, error.message);
      test.done();
      return;
    }
    console.log("Serial ports:");
    for (var i = 0; i < ports.length; i++) {
      console.log("  " + ports[i].comName);
    }
    test.done();
  });
};
