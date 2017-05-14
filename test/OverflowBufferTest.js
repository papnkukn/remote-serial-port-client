var OverflowBuffer = require('../lib/OverflowBuffer.js');

exports["constructor"] = function(test) {
  //test.expect(1);
  
  var buffer = new OverflowBuffer();
  
  test.done();
};

exports["append"] = function(test) {
  //test.expect(1);
  
  var buffer = new OverflowBuffer();
  buffer.append(new Buffer("hello"));
  buffer.append(" ");
  buffer.append("world");
  
  test.ok(buffer.length == 11);
  
  test.done();
};

exports["read"] = function(test) {
  //test.expect(1);
  
  var buffer = new OverflowBuffer({ verbose: true });
  buffer.append(new Buffer("hello"));
  buffer.append(" ");
  buffer.append("world");
  
  buffer.read(function(error, data) {
    if (error) {
      test.ok(false, error);
      test.done();
      return;
    }
    
    test.ok(data.length == 11);
    test.done();
  });
};

exports["overflow"] = function(test) {
  //test.expect(1);
  
  var buffer = new OverflowBuffer({ capacity: 10 });
  
  //Write 11 chars
  buffer.append("hello world");
  
  test.ok(buffer.overflow == true);
  test.ok(buffer.length == 10);
  
  test.done();
};
