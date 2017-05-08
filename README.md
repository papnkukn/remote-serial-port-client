## Introduction

Serial port over ethernet using a HTTP server with WebSockets and REST API.

`NOTE: This is an early version of the script - not yet ready for production environment. Please be patient.`

## Getting Started

Install the package:
```bash
npm install remote-serial-port-client
```

Make sure the server is running:
```bash
npm install -g remote-serial-port-server
remote-serial-port-server --port 5147
```

List serial ports:
```javascript
var serialport = new RemoteSerialPort({ url: "http://localhost:5147/" });
serialport.list(function(error, ports) {
  console.log(ports);
});
```

## Use in Node.js

Initialize
```javascript
var RemoteSerialPort = require("remote-serial-port-client");
var serialport = new RemoteSerialPort({ url: "http://localhost:5147/" });
...
```

## Use in browser

Reference the library:
```html
<script src="dist/RemoteSerialPort.min.js"></script>
```

Initialize in JavaScript:
```javascript
var serialport = new RemoteSerialPort({ url: "http://localhost:5147/" });
...
```

## Methods

### Constructor

```
new RemoteSerialPort(options)
```

### list(callback)

Lists available serial ports from the remote host.

Arguments         | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, ports)

### status(port, callback)

Gets the specified serial port status.

Arguments         | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, status)

### open(port, options, callback)

Opens the specified serial port.

Arguments         | Type      | Description
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

Arguments         | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, result)

### write(port, data, callback)

Writes data to the serial port.

Arguments         | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
data              | mixed     | Data to be sent to serial port, String of Buffer
callback          | function  | function(error, result)

### read(port, callback)

Reads data from the serial port receive buffer.

Arguments         | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, data)

### available(port, callback)

Gets a number of bytes waiting in the serial port receive buffer.

Arguments         | Type      | Description
----------------- | --------- | ---------------------------------------------------------------------------------
port              | string    | Serial port name, e.g. COM1 or ttyUSB0 (without /dev)
callback          | function  | function(error, result)

## Server-side

See [remote-serial-port-server](/papnkukn/remote-serial-port-server) script.