var express = require('express');
var http = require('http');

var app = express();
var server = http.createServer();

var locals = {
        title:       'NodeJS Boostrap using Express / EJS / Twitter Bootstrap / CSS3',
        description: 'Node Express HTML5 & CSS3',
        author:      'Alexandre Collin'
    };

var init = function(port) {

    app.configure(function(){
    	app.set('views', __dirname + '/views');
    	app.set('view engine', 'ejs');
    	app.use(express.bodyParser());
    	app.use(express.methodOverride());
    	app.use(express.static(__dirname + '/static'));
    	app.use(app.router);
        app.use(function(err, req, res, next){ res.render('500.ejs', { locals: { error: err },status: 500 }); });
    	app.enable("jsonp callback");
    });

    app.configure('development', function(){
	   app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
        // app.use(express.logger({ format: ':method :url' }));
    });

    app.configure('production', function(){
	   app.use(express.errorHandler()); 
    });

    app.listen(port);

    console.log("Listening on port %d in %s mode", port, app.settings.env);

    return app;
}

app.get('/', function(req,res){

    locals.date = new Date().toLocaleDateString();

    console.log("Request recieved");

    res.render('template.ejs', locals);
    //res.send("Hello world");
});

/* The 404 Route (ALWAYS Keep this as the last route) */
app.get('/*', function(req, res){
    res.render('404.ejs', locals);
});

init(4000);