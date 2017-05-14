var semaphore = require("semaphore");

function OverflowBuffer(options) {
  var self = this;
  
  //Default option values
  var defaults = {
    capacity: 65535
  };
  
  //Merge objects
  self.options = Object.assign({ }, defaults, options || { });
  
  //Receive buffer
  self.overflow = false;
  self.buffer = new Buffer(self.options.capacity);
  self.index = 0;
  self.length = 0;
  
  //Semaphore to manage parallel requests
  self.sem = semaphore(1);
}

OverflowBuffer.prototype.append = function(data) {
  var self = this;
  
  if (!data) {
    throw new Error("Missing data argument!");
  }
  
  if (typeof data == 'string') {
    data = new Buffer(data);
  }
  
  //TODO: Object Buffer
  if (typeof data.copy != "function") {
    throw new Error("Missing 'copy' function!");
  }
  
  self.sem.take(function() {
    //Append data to the buffer
    var length = 0;
    var position = self.index;
    var overflow = position >= self.options.capacity;
    if (!overflow) {
      var available = self.options.capacity - position;
      length = data.length;
      overflow = length > available;
      length = overflow ? available : length;
      data.copy(self.buffer, position, 0, length);
      self.index += length;
      self.length = self.index;
    }
    self.overflow = overflow;
    self.sem.leave();
  });
};

OverflowBuffer.prototype.read = function(index, length, callback) {
  var self = this;
  
  //Shift arguments
  if (typeof index == 'function' && !length) {
    length = index;
  }
  
  //Shift arguments
  if (typeof length == 'function' && !callback) {
    callback = length;
  }
  
  self.sem.take(function() {
    //Optional 'take' query string defined number of bytes to read
    var take = length >= 0 ? length : self.options.capacity;
    if (take > self.index) {
      take = self.index;
    }
    
    //Send just the filled part of the buffer
    var data = new Buffer(take);
    self.buffer.copy(data, 0, 0, take);
    self.buffer.fill(0x00); //Clear the buffer
    self.overflow = false;
    self.index = 0;
    self.length = self.index;
    
    self.sem.leave();
    
    if (callback) {
      callback(null, data);
    }
  });
};

OverflowBuffer.prototype.clear = function(callback) {
  var self = this;
  
  self.sem.take(function() {
    port.overflow = false;
    port.buffer.fill(0x00);
    port.index = 0;
    self.length = self.index;
    self.sem.leave();
    
    if (callback) {
      callback();
    }
  });
};

OverflowBuffer.prototype.cursor = function(pos, callback) {
  var self = this;
  self.sem.take(function() {
    if (pos >= 0) {
      self.index = pos;
    }
    self.sem.leave();
    
    //Shift arguments
    if (typeof pos == 'function' && !callback) {
      callback = pos;
    }
    
    if (callback) {
      callback(null, pos);
    }
  });
};

module.exports = OverflowBuffer;