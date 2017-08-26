var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function(req, res){
  const PUBLIC_FOLDER = __dirname
  res.sendFile(PUBLIC_FOLDER + '/index.html');
});

app.all('*', function(req, res) {
  const PUBLIC_FOLDER = __dirname
  res.sendFile(PUBLIC_FOLDER + '/index.html');
});

/**********************
* WebSocket Portion
***********************/

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // We are given a websocket object in our function
  function (socket) {

    console.log("We have a new client: " + socket.id);

    // When this user emits, client side: socket.emit('otherevent',some data);
    socket.on('coords',
      function(data) {
        // Data comes in as whatever was sent, including objects
        //console.log("Received: 'coords' " + data.x + " " + data.y);

        // Send it to all other clients
        socket.broadcast.emit('coords', data);

        // This is a way to send to everyone including sender
        // io.sockets.emit('message', "this goes to everyone");
      }
    );

    socket.on('disconnect', function(socket) {
      console.log("Client has disconnected");
    });
  }
);

http.listen(port, function(){
  console.log('listening on *:' + port);
});
