'use strict';
var chalk = require('chalk');
var db = require('./db');

// Create a node server instance! cOoL!
var server = require('http').createServer();

var createApplication = function () {
    var app = require('./app')(db);
    server.on('request', app); // Attach the Express application.
    require('./io')(server);   // Attach socket.io.
};

var startServer = function () {

    var PORT = process.env.PORT || 1337;
    app.get('/', function(request, response) {
	    var result = 'App is running'
	    response.send(result);
	}).listen(app.get('port'), function() {
	    console.log('App is running, server is listening on port ', app.get('port'));
	});

    server.listen(PORT, function () {
        console.log(chalk.blue('Server started on port', chalk.magenta(PORT)));
    });

};

db.sync().then(createApplication).then(startServer).catch(function (err) {
    console.error(chalk.red(err.stack));
});
