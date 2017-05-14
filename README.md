## Introduction

Serial port over ethernet using a HTTP server with WebSockets and REST API.

`NOTE: This is an early version of the script - not yet ready for production environment. Please be patient.`

## Getting Started

Install the package
```bash
npm install remote-serial-port-client
```

Make sure the server is running
```bash
npm install -g remote-serial-port-server
remote-serial-port-server --port 5147
```

List serial ports
```javascript
var RemoteSerialPort = require('remote-serial-port-client').RemoteSerialPort;
var serialport = new RemoteSerialPort({ url: "http://localhost:5147/" });
serialport.list(function(error, ports) {
  console.log(ports);
});
```

## Use in Node.js

Initialize
```javascript
var RemoteSerialPort = require('remote-serial-port-client').RemoteSerialPort;
var serialport = new RemoteSerialPort({ url: "http://localhost:5147/" });
...
```

Using a TCP socket
```javascript
var RemoteSerialPort = require('remote-serial-port-client').RemoteSerialPort;
var tcp = new RemoteSerialPort({ mode: "tcp", host: "127.0.0.1", port: 5147 });
tcp.open(function(error, result) {
  console.log("Connected");
  setTimeout(function() {
    tcp.write("AT;\n");
  }, 3000);
});
tcp.on("read", function(result) {
  console.log("read", result.data.toString('ascii'));
});
```

Similar for UDP, just change the `mode` to `udp`.

## Use in browser

Reference the library
```html
<script src="dist/RemoteSerialPort.min.js"></script>
```

Initialize in JavaScript
```javascript
var serialport = new RemoteSerialPort({ url: "http://localhost:5147/" });
...
```

## Methods

### new RemoteSerialPort(options)

Creates a new instance.

Propreties of `options` argument:

Argument name     | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
verbose           | boolean   | A value indicating whether to print details to console
mode              | string    | Mode: http, tcp, udp; default: http
url               | string    | URL to the the HTTP of the serial port server, mode 'http' only
host              | string    | Host name or IP address of the serial port server, TCP and UDP only
port              | number    | Port number of the serial port server, TCP and UDP only

### list(callback)

Lists available serial ports from the remote host.

Argument name     | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, ports)

### status(port, callback)

Gets the specified serial port status.

Argument name     | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, status)

### open(port, options, callback)

Opens the specified serial port.

Argument name     | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
options           | object    | Serial port config
options.baudRate  | numeric   | Baud rate, e.g. 9600, 57600, 115200, etc.
options.dataBits  | numeric   | Data bits: 5, 6, 7 or 8
options.stopBits  | numeric   | Stop bits: 1 or 2
options.parity    | string    | Parity: none, even, mark, odd, space
callback          | function  | function(error, result)

### close(port, callback)

Closes the specified serial port.

Argument name     | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, result)

### write(port, data, callback)

Writes data to the serial port.

Argument name     | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
data              | mixed     | Data to be sent to serial port, String of Buffer
callback          | function  | function(error, result)

### read(port, callback)

Reads data from the serial port receive buffer.

Argument name     | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, data)

### available(port, callback)

Gets a number of bytes waiting in the serial port receive buffer.

Argument name     | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, result)

## Server-side

See [remote-serial-port-server](https://github.com/papnkukn/remote-serial-port-server) script.