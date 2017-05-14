;(function(global) {

//Manage imports
var env = "unknown";
var request, createWebSocket;
if (typeof exports === 'object' || (typeof define === 'function' && define.amd)) {
  request = require('request');
  
  //Extensions for a WebSocket
  createWebSocket = function(url) {
    var WebSocket = require('ws');
    var ws = new WebSocket(url);
    
    //Create event emitter
    ws._onevent = { };
    ws._delayed = [ ];
    ws._emit = function(name, data) {
      var callback = ws._onevent[name];
      if (callback) {
        //Trigger the event if registered
        if (data) callback(data);
        else callback();
      }
      else {
        //Register delayed event
        ws._delayed.push({ name: name, data: data });
      }
    };
    
    //Handle default WebSocket functions
    ws.on('open', function() {
      ws._emit("open");
    });
    ws.on('close', function() {
      ws._emit("close");
    });
    ws.on('message', function(data, flags) {
      //flags.binary - data is binary
      //flags.masked - data was masked
      //console.log(data.toString('ascii'));
      ws._emit("read", data);
    });
    ws.on('error', function(error) {
      ws._emit("error", event);
    });
    
    //Overwrite "on" function
    ws._on = ws.on;
    ws.on = function(name, callback) {
      if (!ws._onevent[name]) {
        //Trigger the delayed event on first registration
        var i = 0;
        while (ws._delayed[i++]) {
          var event = ws._delayed[i];
          if (event.name == name) {
            if (event.data) callback(event.data);
            else callback(); //Callback without arguments
          }
          ws._delayed.splice(i, 1);
          i--;
        }
      }
      ws._onevent[name] = callback;
    };
    
    //Add write function
    ws.write = function(data) {
      ws.send(data);
      ws._emit("write", data);
    };
    
    return ws;
  };
  
  env = "node";
}
else if (typeof jQuery !== 'undefined') {
  //jQuery wrapper for require('request')
  request = function(options, callback) {
    var ajax = {
      cache: false,
      type: options.method || "GET",
      url: options.url || "#",
      data: options.body,
      dataType: "json",
      error: function(xhr, status, error) {
        if (callback) {
          callback(xhr.responseJSON, { statusCode: status }, null);
        }
      },
      success: function(result, status, xhr) {
        if (callback) {
          callback(null, { statusCode: status }, result);
        }
      }
    };
    if (options.headers) {
      ajax.headers = options.headers;
    }
    if (options.headers && options.headers["Content-Type"]) {
      ajax.contentType = options.headers["Content-Type"];
    }
    console.log(ajax);
    jQuery.ajax(ajax);
  };
  
  //Extensions for a browser's WebSocket
  createWebSocket = function(url) {
    if (!global.WebSocket) {
      throw new Error("Browser does not support WebSocket!");
    }
    
    var ws = new global.WebSocket(url);
    ws.binaryType = 'arraybuffer';
    
    //Create event emitter
    ws._onevent = { };
    ws._delayed = [ ]; //For events that are registered after the return statement, e.g. open is triggered before the "on" event can be registered
    ws._emit = function(name, data) {
      var callback = ws._onevent[name];
      if (callback) {
        //Trigger the event if registered
        if (data) callback(data);
        else callback();
      }
      else {
        //Register delayed event
        ws._delayed.push({ name: name, data: data });
      }
    };
    
    //Handle default WebSocket functions
    ws.onopen = function(event) {
      ws._emit("open");
    };
    ws.onclose = function(event) {
      ws._emit("close");
    };
    ws.onmessage = function(event) {
      ws._emit("read", new Uint8Array(event.data));
    };
    ws.onerror = function(event) {
      ws._emit("error", event);
    };
    
    //Overwrite "on" function
    ws._on = ws.on;
    ws.on = function(name, callback) {
      if (!ws._onevent[name]) {
        //Trigger the delayed event on first registration
        var i = 0;
        while (ws._delayed[i++]) {
          var event = ws._delayed[i];
          if (event.name == name) {
            if (event.data) callback(event.data);
            else callback(); //Callback without arguments
          }
          ws._delayed.splice(i, 1);
          i--;
        }
      }
      ws._onevent[name] = callback;
    };
    
    //Add write function
    ws.write = function(data) {
      ws.send(data);
      ws._emit("write", data);
    };
    
    return ws;
  };
  
  env = "jquery";
}
else {
  return console.error("RemoteSerialPort not available in this environment! Hint: try with Node.js or jQuery.");
}

/**************************************************************************************//**
 * Constructor
 * @param options Object with arguments, required: url
 ******************************************************************************************/
function RemoteSerialPort(options) {
  var self = this;
  self.events = { };

  //Default option values
  var defaults = {
    verbose: false,
    mode: "http",
    url: null,
    userAgent: null
  };
  
  //Merge objects
  self.options = Object.assign({ }, defaults, options || { });
  
  //Mode-dependent procedure
  switch (self.options.mode) {
    case "http":
      if (!self.options.url) {
        throw new Error("Missing required 'url' parameter!");
      }
      
      if (!self.options.userAgent && typeof require === 'function') {
        var pkg = require('../package.json');
        self.options.userAgent = "RemoteSerialPort/" + pkg.version;
      }
      
      if (typeof request.defaults === 'function') {
        request.defaults({
          headers: {
            "Accept": "application/json",
            "User-Agent": self.options.userAgent
          }
        });
      }
      break;
      
     case "udp":
     case "tcp":
      if (env != "node") {
        throw new Error("TCP and UDP sockets are available only in Node.js");
      }
      
      //Feature not available when using TCP or UDP socket
      function unavailable(a, b, c, d) {
        throw new Error("Not available in this mode!");
      }
      
      //Initialize the socket mode
      var RemoteSerialPortSocket = require('./RemoteSerialPortSocket.js');
      var socket = new RemoteSerialPortSocket(self.options);
      self.socket = socket;
      self.options = socket.options;
      self.events = socket.events;
      self.emit = socket.emit;
      self.buffer = socket.buffer;
      
      //Remap to make functions compatible
      self.list = unavailable;
      self.status = unavailable;
      self.open = function(port, options, callback) {
        var self = this;
        if (port && self.options.verbose) {
          console.warn("Warning: Serial port name is ignored when using a socket!");
        }
        if (options && self.options.verbose) {
          console.warn("Warning: Serial port options are ignored when using a socket!");
        }
        if (typeof port == 'function' && !options) {
          options = port; //Shift argument
        }
        if (typeof options == 'function' && !callback) {
          callback = options; //Shift argument
        }
        self.socket.open(callback);
      };
      self.close = function(port, callback) {
        if (typeof port == 'function' && !callback) {
          callback = port; //Shift argument
        }
        self.socket.close(callback);
      };
      self.write = function(port, data, callback) {
        //Shift arguments
        if (port && !data && !callback) {
          data = port;
        }
        if (typeof data == 'function' && !callback) {
          data = port;
          callback = data;
        }
        self.socket.write(data, callback);
      };
      self.read = function(port, callback) {
        if (typeof port == 'function' && !callback) {
          callback = port; //Shift argument
        }
        self.socket.read(callback);
      };
      self.clearReadBuffer = function(port, callback) {
        if (typeof port == 'function' && !callback) {
          callback = port; //Shift argument
        }
        self.socket.clearReadBuffer(callback);
      };
      self.available = function(port, callback) {
        if (typeof port == 'function' && !callback) {
          callback = port; //Shift argument
        }
        self.socket.available(callback);
      };
      self.bind = unavailable;
      self.on = socket.on;
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
  
  //A private method to handle HTTP requests
  self.request = function(options, callback) {
    try {
      request({
        method: options.method || "GET",
        url: self.options.url + options.route,
        headers: options.headers,
        body: options.body
      }, function (error, response, body) {
        if (callback) {
          try {
            if (error) {
              throw error;
            }
            
            var data;
            try {
              data = JSON.parse(body);
            }
            catch (err) {
              data = body;
            }
            
            if (response && response.statusCode >= 400) {
              throw new Error(data.error || ("HTTP Status Code " + response.statusCode));
            }
            
            callback(null, data);
          }
          catch (err) {
            callback(err);
          }
        }
      });
    }
    catch (error) {
      if (callback) {
        callback(error);
      }
    }
  };
}

/**************************************************************************************//**
 * Gets a list of available serial ports.
 * @param callback function(error, list)
 ******************************************************************************************/
RemoteSerialPort.prototype.list = function(callback) {
  var self = this;
  self.request({
    method: "GET",
    route: "api/v1/port"
  }, callback);
};

/**************************************************************************************//**
 * Gets a specific serial port status.
 * @param callback function(error, list)
 ******************************************************************************************/
RemoteSerialPort.prototype.status = function(port, callback) {
  var self = this;
  self.request({
    method: "GET",
    route: "api/v1/port/" + port
  }, callback);
};

/**************************************************************************************//**
 * Opens a serial port.
 * @param port     Port name, e.g. 'COM1' or '/dev/ttyUSB0'
 * @param options  Object with extra arguments: baudRate, dataBits, stopBits, parity, etc.
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.open = function(port, options, callback) {
  var self = this;
  self.request({
    method: "POST",
    route: "api/v1/port/" + port + "/open",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options || { })
  }, callback);
};

/**************************************************************************************//**
 * Closes a serial port.
 * @param port     Port name, e.g. 'COM1' or '/dev/ttyUSB0'
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.close = function(port, callback) {
  var self = this;
  self.request({
    method: "POST",
    route: "api/v1/port/" + port + "/close",
    headers: {
      "Accept": "application/json"
    }
  }, callback);
};

/**************************************************************************************//**
 * Sends data to a serial port.
 * @param port     Port name, e.g. 'COM1' or '/dev/ttyUSB0'
 * @param data     Buffer or string
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.write = function(port, data, callback) {
  var self = this;
  self.request({
    method: "POST",
    route: "api/v1/port/" + port + "/write",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/octet-stream"
    },
    body: data
  }, callback);
};

/**************************************************************************************//**
 * Reads data waiting in a serial port receive buffer.
 * @param port     Port name, e.g. 'COM1' or '/dev/ttyUSB0'
 * @param callback function(error, data)
 ******************************************************************************************/
RemoteSerialPort.prototype.read = function(port, callback) {
  var self = this;
  self.request({
    method: "GET",
    route: "api/v1/port/" + port + "/read",
    headers: {
      "Accept": "application/json"
    }
  }, callback);
};

/**************************************************************************************//**
 * Resets the receive buffer.
 * @param port     Port name, e.g. 'COM1' or '/dev/ttyUSB0'
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.clearReadBuffer = function(port, callback) {
  var self = this;
  self.request({
    method: "DELETE",
    route: "api/v1/port/" + port + "/read",
    headers: {
      "Accept": "application/json"
    }
  }, callback);
};

/**************************************************************************************//**
 * Gets a number of bytes waiting in a serial port receive buffer.
 * @param port     Port name, e.g. 'COM1' or '/dev/ttyUSB0'
 * @param callback function(error, result)
 ******************************************************************************************/
RemoteSerialPort.prototype.available = function(port, callback) {
  var self = this;
  self.request({
    method: "GET",
    route: "api/v1/port/" + port + "/available",
    headers: {
      "Accept": "application/json"
    }
  }, callback);
};

/**************************************************************************************//**
 * Connects to a remote serial port using WebSocket.
 * @param port     Port name, e.g. 'COM1' or '/dev/ttyUSB0'
 * @param callback function(error, websocket)
 ******************************************************************************************/
RemoteSerialPort.prototype.bind = function(line, port) {
  var self = this;
  
  if (!port) {
    throw new Error("Missing serial port name!");
  }
  
  if (line != "data" && line != "control") {
    throw new Error("Only 'data' and 'control' line allowed!");
  }
  
  var ws = createWebSocket('ws://localhost:5147/api/v1/port/' + port + '/' + line);
  
  //Control line
  if (line == "control") {
    ws.open = function(data) {
      var obj = { event: "open", data: data };
      ws.send(JSON.stringify(obj));
      ws._emit("write", data);
    };
  }
  
  return ws;
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

if (typeof exports === 'object') {
  //node.js
  module.exports = RemoteSerialPort;
}
else if (typeof define === 'function' && define.amd) {
  //amd
  define(function () {
    return RemoteSerialPort;
  });
}
else {
  //Web browser
  global.RemoteSerialPort = RemoteSerialPort;
}
}(this));