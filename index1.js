var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

//Whenever someone connects this gets executed
var driverLocationSocketList = {};

/****************************** Trip Tracking Room Logic *********************************/

var tripSocket = io.of('/tripTracker');
tripSocket.on('connection', function (socket) {

    //set room for trip.
    socket.on('setTripToListen', function (data) {
        socket.join(data.tripCode);
    });

    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        socket.disconnect(true);
    });

});

app.post('/driverLocationChange', function (req, res) {

    var tripCode =  req.body.tripCode;
    var data = {
        tripCode: req.body.tripCode,
        latitude: req.body.lat,
        longitude: req.body.lng,
        accuracy: req.body.accuracy,
        heading: req.body.heading,
        speed: req.body.speed
    };

    tripSocket.to(tripCode).emit('driverLocationChange', data);
    res.json({ 'success': true });

});

app.post('/newTrip', function (req, res) {

    var tripCode =  req.body.tripCode;
    tripSocket.emit('tripStatusChange', req.body);
    res.json({ 'success': true });
});


app.post('/newDriverTrip', function (req, res) {

    var tripCode =  req.body.tripCode;
    //Channel will be driver code here.
    tripSocket.emit(req.body.driverCode, req.body);
    res.json({ 'success': true });
});

app.post('/tripStatusChange', function (req, res) {

    var tripCode =  req.body.tripCode;
    tripSocket.to(tripCode).emit('tripStatusChange', req.body);
    res.json({ 'success': true });
});



/****************************** Trip Tracking Room Logic *********************************/

var notificationSocket = io.of('/notification');
notificationSocket.on('connection', function (socket) {

    socket.on('subscribe', function (data) {
        socket.join(data.channelName);
    });

    socket.on('disconnect', function () {
        socket.disconnect(true);
    });

});

app.post('/newNotification', function(req, res){
    var channelName =  req.body.channelName;
    notificationSocket.to(channelName).emit('new_notification', req.body.data);
    res.json({ 'success': true });
});

app.post('/resolveNotification', function(req, res){
    var channelName =  req.body.channelName;
    notificationSocket.to(channelName).emit('resolve_notification', req.body.data);
    res.json({ 'success': true });
});

app.post('/removeNotification', function(req, res){
    var channelName =  req.body.channelName;
    notificationSocket.to(channelName).emit('remove_notification', req.body.data);
    res.json({ 'success': true });
});

/****************************** Web calls Logic *********************************/

app.get('/test1234', function(req,res){
    res.send('Node running.. ' + new Date() );
});

app.get('/', function (req, res) {
    res.sendfile('index.html');
});

http.listen(3001, function () {
    console.log('listening on *:3001');
});
