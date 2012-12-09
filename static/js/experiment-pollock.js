var width = 960,
    height = 500,
    radius = 200;

var svg;
var color;

var bDualClocks = false;

initPollock = function()
{
    svg = d3.select("#graphArea").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	  	.append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	colour = d3.scale.linear()
    	.range(["#4188D2", "#FFAD40", "FF8673"]);

    var bClockToggle = false;
    var bDualClocks = true;
	var viewingRange = "day";
	var defaultDateStr = "2011-11-10";
	var defaultDate = new Date(defaultDateStr);
	var pollockFunc = clockPollock;

	//Jquery UI functions
	//--------------------
	$( "#startDatePicker" ).datepicker({
	    changeMonth: true,
	    changeYear: true,
	    dateFormat: "yy-mm-dd"
	}).val(defaultDateStr).change(function(){
		updateGraph();
	});

	$( "#slider-range-min" ).slider({
	    range: "min",
	    value: defaultDate.getDate(),
	    min: 1,
	    max: new Date(defaultDate.getFullYear(), defaultDate.getMonth()+1, 0).getDate(),
	    slide: function( event, ui ) {
	        updateGraph();
	    }
	});

	$("#dayBtn").click(function(){
	    viewingRange = "day";
	    updateGraph();

	    var targetMonth = new Date($("#startDatePicker").val());
	    
	    $( "#slider-range-min" ).slider("option", "max", 
	        new Date(targetMonth.getFullYear(), targetMonth.getMonth()+1, 0).getDate()
	    );
	    $("#dayOptions").show();
	});

	$("#weekBtn").click(function(){
	    viewingRange = "week";
	    updateGraph();
	    $( "#slider-range-min" ).slider("option", "max", 5);
	    $("#dayOptions").hide();
	});

	$("#monthBtn").click(function(){
	    viewingRange = "month";
	    updateGraph();
	});

	$("#numCircles").change(function(){
		updateGraph();
	});

	$("#changePollockType").click(function(){
		bClockToggle = !bClockToggle;
		(bClockToggle) ? pollockFunc = pollockPercentage : pollockFunc = clockPollock;
		updateGraph();
	});

	$("#dualClocks").click(function(){
		bDualClocks = !bDualClocks;
		updateGraph();
	});

	function updateGraph()
	{
		var numCircles;
		var useClocks;
		var targetMonth = new Date($("#startDatePicker").val());
		var sliderVal = $( "#slider-range-min" ).slider("value");

        if(viewingRange == "day") {
        	targetMonth.setDate(sliderVal);
        	numCircles = $("#numCircles").val();
        }

        else if(viewingRange == "week") {targetMonth.setDate(sliderVal * 5);}
        else if(viewingRange == "month") {targetMonth.setMonth(sliderVal);}
		
		if(bDualClocks) useClocks = true;

	    getPowerData(viewingRange, targetMonth, function(d){
	    	pollockFunc(d, useClocks);
	    }, numCircles, useClocks);
	}


	//Get initial data from server
	updateGraph();
}

getPowerData = function(timeType, startRange, callback, numCircles, useClocks)
{
	rangeValueQuery = function(date){
		return url += 'dayValues'
					+ "?year=" + date.getFullYear()
					+ "&month=" + ("0" + (date.getMonth() + 1)).slice(-2)
					+ "&day=" + ("0" + date.getDate()).slice(-2)
					+ "&controlled=1";
	}

	rangeSumQuery = function(dateA, dateB){

		return url += 'rangeSum'
					+ "?yearA=" + startDay.getFullYear()
					+ "&monthA=" + ("0" + (startDay.getMonth() + 1)).slice(-2)
					+ "&dayA=" + ("0" + startDay.getDate()).slice(-2)
					+ "&yearB=" + endDay.getFullYear()
					+ "&monthB=" + ("0" + (endDay.getMonth() + 1)).slice(-2)
					+ "&dayB=" + ("0" + endDay.getDate()).slice(-2)
					+ "&controlled=1";
	}

	var url = "http://tringlightningbolt.com/";
	var query;

	var startDay = new Date(startRange);
	var endDay = new Date(startRange);
	var day = startRange.getDay();
	var date = startRange.getDate() - 1;
	var dateString;

	if(timeType == "day")
	{
		query = rangeValueQuery(startRange);
		dateString = "Date of " + startRange.getFullYear() + "/" + startRange.getMonth() + "/" + startRange.getDate();
	}
	else if(timeType == "week")
	{
		startDay.setDate(startDay.getDate() - day);
		endDay.setDate(endDay.getDate() + (6 - day));
		query = rangeSumQuery(startDay, endDay);
		dateString = "Week of " + startDay.getFullYear() 
			+ "/" + startDay.getMonth() 
			+ "/" + startDay.getDate()
			+ " to " 
			+ endDay.getFullYear() 
			+ "/" + endDay.getMonth() 
			+ "/" + endDay.getDate();

	} else if(timeType == "month")
	{
		startDay.setDate(1);
		endDay.setDate(new Date(startRange.getFullYear(), startRange.getMonth()+1, 0).getDate() );
		query = rangeSumQuery(startDay, endDay);
		dateString = "Month of " + startDay.getFullYear() + "/" + startDay.getMonth();
	}

	d3.json(query, function(json){
		var response = [];

		if(numCircles != undefined){	
			if(json.powerData.values != undefined){
				var modulo = json.powerData.values.length / numCircles;	
				var sum = 0;


				for(var i = 0; i < json.powerData.values.length; i++){
					sum += json.powerData.values[i];
					if(i % modulo == 0){
						response.push(sum);
						sum = 0;
					}
				}
			}
		} else {
			if(json.powerData.values == undefined){
				for(var entry in json.powerData){
					response.push(json.powerData[entry].sum);
				}
			}
		}

		callback(response);


		$("#currentDate").html(dateString);
	});   
}


clockPollock = function(sampleData, useClocks)
{
	var largest = 0;
	var smallest = 0;

	console.log(useClocks);

	for(var entry in sampleData)
	{
		var diff = sampleData[entry];
		
		if(largest == 0 && smallest == 0) smallest = largest = diff;
		if(Math.max(diff, largest) > largest) largest = diff;
		if(Math.min(diff, smallest) < smallest) smallest = diff;
	}

	colour.domain([smallest, largest]);

	var radiusMult = largest / smallest;

	var circle = svg.selectAll("circle").data(sampleData);
	var angleInc = Math.PI*2 / sampleData.length;

	circle.enter()
		.append("circle").attr("fill", "#FFFFFF");
	

	circle.transition().duration(750).attr("cx", function(d,i){
			var offset = 0;
			var result;

			if(useClocks){
				if(i < sampleData.length/2 ){
					offset = -radius * 1.1;
					result = Math.cos(i*2 * angleInc - Math.PI/2) * radius + offset;
				}else{
					offset = radius * 1.1;
					result = Math.cos(i*2 * angleInc - Math.PI/2) * radius + offset;
				}
			} else {
				result = Math.cos(i * angleInc - Math.PI/2) * radius;
			}

			return result;
		})
		.transition().duration(750).attr("cy", function(d,i){
			var result;
			if(useClocks)
				result = Math.sin(i*2 * angleInc - Math.PI/2) * radius;
			else
				result = Math.sin(i * angleInc - Math.PI/2) * radius;
			
			return result;
		})
		.transition().duration(750).attr("fill", function(d){ return colour(d);})
		.transition().duration(750).ease("quad-out").attr("r", function(d){
			return d *radiusMult ;
		});

	circle.exit()
		.transition().duration("750")
		.attr("r", 0)
		.attr("fill", "#FFFFFF")
		.remove();
}


pollockPercentage = function(sampleData)
{
	var pie = d3.layout.pie().sort(null).value(function(d){
		var result;
		(d.sum == undefined) ? result = d : result = d.sum;
		return result;
	});

	var pieAngles = pie(sampleData);
	var largest =0;
	var smallest = 0;

	for(var ang in sampleData)
	{
		var angle = sampleData[ang];
		diff = angle;
		
		if(largest == 0 && smallest == 0) smallest = largest = diff;
		if(Math.max(diff, largest) > largest) largest = diff;
		if(Math.min(diff, smallest) < smallest) smallest = diff;
	}

	var innerRad =radius;
	var outerRad = radius + largest;

    //Exterior circles 
	//----------------
	var circle = svg.selectAll("circle").data(pieAngles);

	circle.enter().append("circle").attr("fill", "#FFFFFF");

	circle.transition().duration(750).attr("cx", function(d,i){
			return ((Math.cos(d.startAngle - Math.PI/2) * radius)
			 + (Math.cos(d.endAngle - Math.PI/2) * radius)) *0.5;
		})
		.transition().duration(750).attr("cy", function(d,i){
			return ((Math.sin(d.startAngle - Math.PI/2) * radius)
			 + (Math.sin(d.endAngle - Math.PI/2) * radius)) *0.5;
		})
		.transition().duration(750).attr("fill", function(d){ return colour(d.data);})
		.transition().duration(750).ease("quad-out").attr("r", function(d){
			return distance(
					Math.cos(d.startAngle - Math.PI/2) * radius, 
					Math.sin(d.startAngle - Math.PI/2) * radius,
					Math.cos(d.endAngle - Math.PI/2) * radius, 
					Math.sin(d.endAngle - Math.PI/2) * radius
				) * 0.5;
		});

	circle.exit()
		.transition().duration("750")
		.attr("r", 0)
		.attr("fill", "#FFFFFF")
		.remove();
}

distance = function(x, y, x0, y0){
    return Math.sqrt((x -= x0) * x + (y -= y0) * y);
};

normalize = function(value, min, max){
	return (max - value) / (max - min);
}