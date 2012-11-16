var express = require('express');
var http = require('http');
var d3 = require('d3');
var csv = require('../Front/src/api/csv');
var fs = require('fs');
var url = require('url');

var app = express();
var server = http.createServer();

var locals = {
        title:       'Tring Prototype Stuff',
        description: 'Node Express HTML5 & CSS3',
        author:      'Alexandre Collin'
};

var csvFile = '../Front/src/public/data/moc.csv';
var csvData;

var port = 4000;

//------------------
//Set up application
//
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/static'));
	app.use(app.router);
    app.use(function(err, req, res, next){ res.render('500.ejs', { locals: { error: err },status: 500 }); });
	app.enable("jsonp callback");
});

app.configure('development', function(){
   app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
   app.use(express.errorHandler()); 
});

app.listen(port);

console.log("Listening on port %d in %s mode", port, app.settings.env);


loadCSV = function(csvFile, callback)
{
    dataCallback = function(jsonObj)
    {
        var uncontrolledMeter = {id:"09A016487", meterData:[]};
        var controlledMeter = {id:"09A016488", meterData:[]};

        for(var entryIndex in jsonObj)
        {
            var entry = jsonObj[entryIndex];
            var timeValues = [];
            var targetMeter = {};
            var meterData = { date:entry["READ_DATE"], dayValues:[]};

            if(entry["METER_NO"] == uncontrolledMeter.id)
                targetMeter = uncontrolledMeter;
            else if(entry["METER_NO"] == controlledMeter.id)
                targetMeter = controlledMeter;

            for(var attr in entry)
            {
                if (attr.match('INT')) {
                    var data = entry[attr];
                    if(data == "")
                        data = null;
                    meterData.dayValues.push(data);  
                }
            } 

            targetMeter.meterData.push(meterData);
        }

        callback({uncontrolled:uncontrolledMeter, controlled:controlledMeter});
    };

    //Load static csv file
    fs.readFile(csvFile,
        function (err, data) {
            csv.utils.csvToJson(data.toString(), dataCallback);
        }
    );
}


//==================
//Request functions
//------------------
app.get('/', function(req,res){

    console.log("Request recieved");

    locals.date = new Date().toLocaleDateString();
    res.render('index.jade', locals);
});


app.get('/stackedGraph', function(req,res){

    console.log("Stacked graph request recieved");

    locals.date = new Date().toLocaleDateString();
    res.render('stackedGraph.jade', locals);
});


//------------------------------------
//Returns entire dataset for one meter

app.get('/getEntireRange', function(req,res)
{
    var callback = function(meter){
        res.send(meter.uncontrolled);
    }

    loadCSV(csvFile, callback);
});


//--------------------------------------------------------------------------
//Returns summed average across entire dataset for meter in a 24 hour period

app.get('/getAverageDayValues', function(req,res)
{ 
    var startDate = url.parse(req.url, true).query.startDate;
    var endDate = url.parse(req.url, true).query.endDate;

    console.log("Start:" + startDate + " End:" + endDate);

    var useDates = false;
    
    if(startDate != undefined && endDate != undefined)
        useDates = true;


    var callback = function(meter)
    {
        var timeValues = [];

        for(var i = 0; i < 48; i++){
            timeValues.push(0.0);
        }
        
        var i = 0;
        var endIndex = meter.uncontrolled.meterData.length;
        var numEntries = meter.uncontrolled.meterData.length;

        dateIndex = function(dateString, target){
            var result = -1;
            for(var i = 0; i < target.length; i++){
                if(target[i].date == dateString){
                    result = i;
                    return result;
                }
            }

            return result;
        }
        //20100917, 20120801, 20120804

        if(useDates){
            console.log("Using Dates");
            i = dateIndex(startDate, meter.uncontrolled.meterData);
            endIndex = dateIndex(endDate, meter.uncontrolled.meterData);
            numEntries = endIndex - i;

            console.log(i);
            console.log(endIndex);
            console.log(numEntries);

            if(i == -1){
                console.log("Couldn't find start");
                i = 0;
            }

            
            if( endIndex == -1){
                console.log("Couldn't find end");
                endIndex = meter.uncontrolled.meterData.length;
            }
            
        }

        for(i; i < endIndex; i++)
        {          
            var entry = meter.uncontrolled.meterData[i].dayValues;

            for(var timeEntry in entry){
                if(entry[timeEntry] != null){
                    timeValues[timeEntry] += parseFloat(entry[timeEntry]);
                }
            }
        }

        for (var timeValue in timeValues)
            timeValues[timeValue] /= numEntries;

        res.send({id:meter.uncontrolled.id, meterData:timeValues});
    }

    loadCSV(csvFile, callback);
});


/* The 404 Route (ALWAYS Keep this as the last route) */
app.get('/*', function(req, res){
    res.render('404.ejs', locals);
});