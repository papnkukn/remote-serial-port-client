var semaphore = require("semaphore");
var OverflowBuffer = require("./OverflowBuffer.js");

/**************************************************************************************//**
 * Constructor
 * @param options Object with arguments, required: host and port
 ******************************************************************************************/
function RemoteSerialPort(options) {
  var self = this;
  self.events = { };

  //Default option values
  var defaults = {
    verbose: false,
    reconnect: true, //Automatically reconnect on connection drop, TCP only
    mode: "tcp", //tcp, udp
    host: "localhost",
    port: 5147
  };
  
  //Merge objects
  self.options = Object.assign({ }, defaults, options || { });
  
  //Mode-dependent procedure
  switch (self.options.mode) {      
    case "udp":
    case "tcp":
      break;
      
    default:
      throw new Error("Unknown mode: " + self.options.mode);
  }
  
  //Private event emitter
  self.emit = function(event, data) {
    var callback = self.events[event];
    if (typeof callback === 'function') {
      callback(data);
    }
  };
  
  //Receive buffer
  self.buffer = new OverflowBuffer({
    verbose: self.options.verbose
  });
}

/**************************************************************************************//**
 * Opens a serial port.
 * @param options  Object with extra arguments: baudRate, dataBits, stopBits, parity, etc.
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.open = function(callback) {
  var self = this;
  
  switch (self.options.mode) {      
    case "udp":
      var dgram = require('dgram');
      self.options.client = dgram.createSocket('udp4');
      self.options.client.on('message', function (message, remote) {
        if (self.options.verbose) {
          console.log("Server " + remote.address + ":" + remote.port + " sent " + message.length + " bytes");
        }
        
        //Notify write event
        self.emit("read", { server: remote, data: message });
        
        //Buffer received data
        self.buffer.append(message);
      });
      
      //Multicast
      /*
      self.options.client.bind(self.options.port, "127.0.0.1");
      self.options.client.on('listening', function () {
        if (self.options.verbose) {
          var address = self.options.client.address();
          console.log('UDP Client listening on ' + address.address + ":" + address.port);
        }
        self.options.client.setBroadcast(true);
        self.options.client.setMulticastTTL(128);
        self.options.client.addMembership(self.options.host, "127.0.0.1");
      });
      */
      
      //Send an empty packet just to notify the presence
      self.options.client.send("", 0, 0, self.options.port, self.options.host, function(err, bytes) {
        if (err) {
          if (self.options.verbose) {
            console.error("Socket send error: ", err);
          }
        }
        if (self.options.verbose) {
          console.log("Socket sent " + bytes + " bytes");
        }
        //if (callback) {
        //  callback();
        //}
      });
      
      if (self.options.verbose) {
        console.log("Socket ready: " + self.options.host + ":" + self.options.port);
      }
      
      if (callback) {
        callback();
      }
      break;
      
    case "tcp":
      var net = require('net');
      self.options.client = new net.Socket();
      self.options.client.connect(self.options.port, self.options.host, function() {
        if (self.options.verbose) {
          console.log("Socket connected: " + self.options.host + ":" + self.options.port);
        }
        if (callback) {
          callback();
        }
      });
      self.options.client.on('data', function(data) {
         if (self.options.verbose) {
          console.log("Server sent " + data.length + " bytes");
        }
        
        //Notify write event
        self.emit("read", { data: data });
        
        //Buffer received data
        self.buffer.append(data);
      });
      self.options.client.on('close', function() {
        if (self.options.verbose) {
          console.log('Connection closed');
        }
        
        //Auto-reconnect option for TCP socket
        if (self.options.reconnect) {
          if (self.options.verbose) {
            console.log('Reconnecting...');
          }
          setTimeout(function reconnect() {
            self.options.client.connect(self.options.port, self.options.host, function() {
              if (self.options.verbose) {
                console.log('Reconnected');
              }
            });
          }, 3000);
        }
      });
      break;
  }
};

/**************************************************************************************//**
 * Closes a serial port.
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.close = function(callback) {
  var self = this;
  
  if (!self.options.client) {
    if (callback) {
      callback(new Error("Socket not open!"));
    }
    return;
  }
  
  switch (self.options.mode) {      
    case "udp":
      self.options.client.close(callback);
      break;
      
    case "tcp":
      self.options.client.destroy(callback);
      break;
  }
};

/**************************************************************************************//**
 * Sends data to a serial port.
 * @param data     Buffer or string
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.write = function(data, callback) {
  var self = this;
  
  if (!self.options.client) {
    if (callback) {
      callback(new Error("Socket not open!"));
    }
    return;
  }
  
  if (!data) {
    if (callback) {
      callback(new Error("Argument 'data' is missing!"));
    }
    return;
  }
  
  //Notify write event
  self.emit("write", { data: data });
 
  switch (self.options.mode) {      
    case "udp":
      self.options.client.send(data, 0, data.length, self.options.port, self.options.host, function(err, bytes) {
        if (callback) {
          callback();
        }
      });
      break;
      
    case "tcp":
      self.options.client.write(data, null, callback);
      break;
  }
};

/**************************************************************************************//**
 * Reads data waiting in a serial port receive buffer.
 * @param callback function(error, data)
 ******************************************************************************************/
RemoteSerialPort.prototype.read = function(callback) {
  var self = this;
  
  if (!self.options.client) {
    if (callback) {
      callback(new Error("Socket not open!"));
    }
    return;
  }
  
  self.buffer.read(callback);
};

/**************************************************************************************//**
 * Resets the receive buffer.
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.clearReadBuffer = function(callback) {
  var self = this;
  
  if (!self.options.client) {
    if (callback) {
      callback(new Error("Socket not open!"));
    }
    return;
  }
  
  self.buffer.clear(callback);
};

/**************************************************************************************//**
 * Gets a number of bytes waiting in a serial port receive buffer.
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.available = function(callback) {
  var self = this;
  
  if (!self.options.client) {
    if (callback) {
      callback(new Error("Socket not open!"));
    }
    return;
  }
  
  self.buffer.cursor(callback);
};

/**************************************************************************************//**
 * Registers an event callback function.
 * @param event    Event name
 * @param callback function(data)
 ******************************************************************************************/
RemoteSerialPort.prototype.on = function(event, callback) {
  var self = this;
  self.events[event] = callback;
};

module.exports = RemoteSerialPort;