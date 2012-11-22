var express = require('express');
var http = require('http');
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
    //app.use(function(err, req, res, next){ res.render('500.ejs', { locals: { error: err },status: 500 }); });
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



//==================
//Request functions
//------------------
app.get('/', function(req,res){
    locals.date = new Date().toLocaleDateString();
    res.render('index.jade', locals);
});

app.get('/pollock', function(req,res){
    locals.date = new Date().toLocaleDateString();
    res.render('forceNode.jade', locals);
});

app.get('/stackedGraph', function(req,res){
    locals.date = new Date().toLocaleDateString();
    res.render('stackedGraph.jade', locals);
});

app.get('/binPacking', function(req,res){
    locals.date = new Date().toLocaleDateString();
    res.render('binPacking.jade', locals);
});


//------------------------------------
//Returns json datasets for meters
app.get('/getRaw', function(req,res)
{
    queryMeter = url.parse(req.url, true).query.meter;

    var callback = function(meter){
        var meterData;
        if(queryMeter == "controlled")
            meterData = meter.controlled;
        else
            meterData = meter.uncontrolled;
        
        res.send(meterData);
    }

    loadCSV(csvFile, callback);
});

app.get('/getAveragedHours', function(req,res)
{
    parseMeterData(
        url.parse(req.url, true).query.startDate, 
        url.parse(req.url, true).query.endDate,
        "averagedHours",
        function(parsedJson){res.send(parsedJson)}
    );   
});

app.get('/getSummedDays', function(req,res)
{
    parseMeterData(
        url.parse(req.url, true).query.startDate, 
        url.parse(req.url, true).query.endDate,
        "summedDays",
        function(parsedJson){res.send(parsedJson)}
    );   
});



//--------------------------------------------------------------------------
//Returns summed average across entire dataset for meter in a 24 hour period

parseMeterData = function(startDate,endDate,action,parsedCallback)
{ 
    var useDates = false;
    
    if(startDate != undefined && endDate != undefined)
        useDates = true;

    if(action == undefined)
        action = "summedDays";


    var jsonCallback = function(meter, action)
    {
        var timeValues = [];
        if(action == "averagedHours") for(var i = 0; i < 48; i++) timeValues.push(0.0);
        var index = 0;
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
            index = dateIndex(startDate, meter.uncontrolled.meterData);
            endIndex = dateIndex(endDate, meter.uncontrolled.meterData);
            numEntries = endIndex - index;

            if(index == -1){
                console.log("Couldn't find start date");
                index = 0;
            }
            
            if( endIndex == -1){
                console.log("Couldn't find end date");
                endIndex = meter.uncontrolled.meterData.length;
            }
        }

        for(index; index < endIndex; index++)
        {  

            var entry = meter.uncontrolled.meterData[index].dayValues;
            var sum = 0;
            var nullCount = 0;
            
            for(var timeEntry in entry){
                if(entry[timeEntry] != null){
                    if(action == "averagedHours") timeValues[timeEntry] += parseFloat(entry[timeEntry]);
                    else if(action == "summedDays") sum += parseFloat(entry[timeEntry]);

                } else {nullCount++;}
            } 

            if(action == "summedDays") { 
                timeValues.push(sum); 
            }
        }   

        if(action == "averagedHours"){ 
            for (var timeValue in timeValues) {
                timeValues[timeValue] /= numEntries; 
            }
        }

        parsedCallback({id:meter.uncontrolled.id, meterData:timeValues});
    }

    loadCSV(csvFile, jsonCallback, action);
}



loadCSV = function(csvFile, callback, action)
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
        callback({uncontrolled:uncontrolledMeter, controlled:controlledMeter}, action);
    };

    //Load static csv file
    fs.readFile(csvFile,
        function (err, data) {
            csv.utils.csvToJson(data.toString(), dataCallback);
        }
    );
}



/* The 404 Route (ALWAYS Keep this as the last route) */
app.get('/*', function(req, res){
    res.send("404");
    //res.render('404.ejs', locals);
});