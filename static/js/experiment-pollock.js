pollock = {

	width : 1024,
	height : 500,
	radius : 200,

 	svg : null,
	colour : null,

	bDualClocks : true,
	bUseDayRange : true,

	colours: [],

	init : function()
	{
	    pollock.svg = d3.select("#graphArea").append("svg")
		    .attr("width", pollock.width)
		    .attr("height", pollock.height);
		  	// .append("g")
		   //  .attr("transform", "translate(" + pollock.width / 2 + "," + pollock.height / 2 + ")");

		pollock.colour = d3.scale.linear()
	    	.range(["#4188D2", "#FFAD40"]);

	    //var bClockToggle = false;
	    //var bDualClocks = true;
		var viewingRange = "day";
		var defaultDateStr = "2011-11-10";
		var defaultDate = new Date(defaultDateStr);
		var pollockFunc = pollock.clockPollock;

		$("#numCircles option:eq(1)").attr("selected", "selected");

		//Jquery UI functions
		//--------------------
		$( "#startDatePicker" ).datepicker({
		    changeMonth: true,
		    changeYear: true,
		    dateFormat: "yy-mm-dd"
		}).val(defaultDateStr).change(function(){
			//updateGraph();
		});

		$("#debugTgl").click(function(){
			$(".debugControls").toggle('400');
		});

		$( "#slider-date" ).dateRangeSlider({
		    bounds:{min: new Date(defaultDate.getFullYear(), defaultDate.getMonth(), 0), 
		    		max: new Date(defaultDate.getFullYear(), defaultDate.getMonth()+1, 0)
		    	}});
		$( "#slider-date" ).on("valuesChanged", function(e, data){
			 updateGraph();
		});

		$( "#slider-range" ).slider({
		    range: true,
		    value: defaultDate.getDate(),
		    min: 1,
		    max: new Date(defaultDate.getFullYear(), defaultDate.getMonth()+1, 0).getDate(),
		    slide: function( event, ui ) {
		        updateGraph();
		    }
		}).hide();

		$( "#slider-min" ).slider({
		    range: "min",
		    value: defaultDate.getDate(),
		    min: 1,
		    max: new Date(defaultDate.getFullYear(), defaultDate.getMonth()+1, 0).getDate(),
		    slide: function( event, ui ) {
		        updateGraph();
		    }
		}).hide();

		$("#dayBtn").click(function(){
		    viewingRange = "day";
		    updateGraph();

		    var targetMonth = new Date($("#startDatePicker").val());
		    
		    $( "#slider-min" ).slider("option", "max", new Date(targetMonth.getFullYear(), targetMonth.getMonth()+1, 0).getDate() )
		    	.slider("option", "range", true);
		    
		    $("#dayOptions").show();
		});

		$("#weekBtn").button().click(function(){
		    viewingRange = "week";
		    $( "#slider-min" ).slider("option", "max", 5);	    
		    $("#dayOptions").hide();
		    updateGraph();
		});

		$("#monthBtn").button().click(function(){
		    viewingRange = "month";
		    $( "#slider-min" ).slider("option", "max", 12);
		   	updateGraph();
		});

		$("#numCircles").change(function(){
			updateGraph();
		});

		$("#changePollockTypeTgl").button().click(function(){
			pollock.bClockToggle = !pollock.bClockToggle;
			(pollock.bClockToggle) ? pollockFunc = pollock.pollockPercentage : pollockFunc = pollock.clockPollock;
			updateGraph();
		});

		$("#dualClocksTgl").button().click(function(){
			pollock.bDualClocks = !pollock.bDualClocks;
			updateGraph();
		});

		$("#dayRangeTgl").button().click(function(){
			pollock.bUseDayRange = !pollock.bUseDayRange;
			if(pollock.bUseDayRange) {
				$("#slider-range").show();
				$("#slider-min").hide();
			} else {
				$("#slider-range").hide();
				$("#slider-min").show();
			}
			updateGraph();
		});

		$("#gradPick").gradientPicker({
				change: function(points, styles) {
					pollock.colours = points;
					updateGraph();
				},
				fillDirection: "45deg",
				controlPoints: ["#4188D2 0%", "#FFAD40 100%"]
			});

		$(".debugControls").hide();

		// $('#colourPickTest').ColorPicker({
		// 	color: '#0000ff',
		// 	flat: true, 
		// 	onChange: function (hsb, hex, rgb) {
		// 		console.log(hex);
		// 		$('#colourPickTest').css('backgroundColor', '#' + hex);
		// 	}
		// });

		// $('#colorSelector').ColorPicker({
		// 	flat: true, 
		// 	onChange: function (hsb, hex, rgb) {
		// 		$('#colorSelector div').css('backgroundColor', '#' + hex);
		// }});



		function updateGraph()
		{
			var numCircles;
			var useClocks;
			var useRange;
			var startRange = new Date($("#startDatePicker").val());
			var targetMonth = new Date($("#startDatePicker").val());
			var endRange = new Date($("#startDatePicker").val());
			var sliderVal = $( "#slider-min" ).slider("value");

			var pointColours = []
			for(var point in pollock.colours) pointColours.push(pollock.colours[point].color);
			pollock.colour.range(pointColours);

			if(pollock.bDualClocks) useClocks = true;
			

	        if(viewingRange == "day") {
	        	if(pollock.bUseDayRange){
					startRange = $( "#slider-date" ).dateRangeSlider("values").min;
					endRange = $( "#slider-date" ).dateRangeSlider("values").max;
				}
	        	targetMonth.setDate(sliderVal);
	        	numCircles = $("#numCircles").val();
	        }

	        else if(viewingRange == "week") {targetMonth.setDate(sliderVal * 5);}
	        else if(viewingRange == "month") {targetMonth.setMonth(sliderVal);}

		    pollock.getPowerData(viewingRange, startRange, endRange, function(d){
		    	pollockFunc(d, useClocks);
		    }, numCircles);
		}

		//Get initial data from server
		updateGraph();
	},

	getPowerData : function(timeType, startRange, endRange, callback, numCircles)
	{
		dayValueQuery = function(date){
			return url += 'dayValues'
						+ "?year=" + date.getFullYear()
						+ "&month=" + ("0" + (date.getMonth() + 1)).slice(-2)
						+ "&day=" + ("0" + date.getDate()).slice(-2)
						+ "&controlled=1";
		}

		rangeValueQuery = function(dateA, dateB){

			return url += 'rangeValues'
						+ "?yearA=" + startRange.getFullYear()
						+ "&monthA=" + ("0" + (startRange.getMonth() + 1)).slice(-2)
						+ "&dayA=" + ("0" + startRange.getDate()).slice(-2)
						+ "&yearB=" + endRange.getFullYear()
						+ "&monthB=" + ("0" + (endRange.getMonth() + 1)).slice(-2)
						+ "&dayB=" + ("0" + endRange.getDate()).slice(-2)
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
		var query, day, date, startDay, endDay, dateString;

		if(!startRange || !endRange){
			startDay = new Date(endRange);
			endDay = new Date(endRange);
			day = endRange.getDay();
			date = endRange.getDate() - 1;
		} else {
			startDay = new Date(startRange);
			endDay = new Date(endRange);
			day = startRange.getDay();
			date = endRange.getDate() - 1;
		}
		

		if(timeType == "day")
		{
			if(startRange && endRange) query = rangeValueQuery(startDay, endDay);
			else query = dayValueQuery(endDay);
			dateString = "Date of " + startDay.getFullYear() + "/" + startDay.getMonth() + "/" + startDay.getDate();
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
				for(var i in json.powerData)
				{
					var modulo = json.powerData[i].values.length / numCircles;	
					var sum = 0;
					var entry = {values:[]};

					for(var j in json.powerData[i].values){
						sum += json.powerData[i].values[j];
						if(j % modulo == 0){
							entry.values.push(sum);
							sum = 0;
						}
					}

					response.push(entry);
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
	},


	clockPollock : function(sampleData, useClocks)
	{
		var largest = 0;
		var smallest = 0;

		for(var entry in sampleData)
		{
			for(var index in sampleData[entry].values)
			{
				var diff = sampleData[entry].values[index];
				
				if(largest == 0 && smallest == 0) smallest = largest = diff;
				if(Math.max(diff, largest) > largest) largest = diff;
				if(Math.min(diff, smallest) < smallest) smallest = diff;
			}
		}

		var domainRange = [];
		var range = largest - smallest;
		var increment = range / pollock.colours.length;
		for(var i=0; i < pollock.colours.length; i++) domainRange.push(smallest + (increment * i));

		pollock.colour.domain(domainRange);

		var radiusMult = largest / smallest;
		var angleInc = Math.PI*2 / sampleData[0].values.length;

		var svgGroup = pollock.svg.selectAll("g").data(sampleData, function(d,i){
			return d;
		});

		var groupEnter = svgGroup.enter().append("g");
		svgGroup.attr("transform", "translate(" + pollock.width / 2 + "," + pollock.height / 2 + ")")
			.attr("fill-opacity", function(d,i){
				if(i == sampleData.length -1) return 1
				return 0.2;
			});
		svgGroup.exit().remove();

		var circGroup = groupEnter.selectAll("circle").data(function(d){
			return d.values;
		});

		circGroup.enter().append("circle").attr("fill", "#FFFFFF").on("mouseover", function(d){
				d3.select(this).style("stroke", "black").attr("stroke-width", 3);
			}).on("mouseout", function(){
				d3.select(this).style("stroke", "none").attr("stroke-wdith", 1);
			}).attr("cx", function(d,i){
				var offset = 0;
				var result;

				if(useClocks){
					if(i < sampleData[0].values.length/2 ){
						offset = -pollock.radius * 1.1;
						result = Math.cos(i*2 * angleInc - Math.PI/2) * pollock.radius + offset;
					}else{
						offset = pollock.radius * 1.1;
						result = Math.cos(i*2 * angleInc - Math.PI/2) * pollock.radius + offset;
					}
				} else {
					result = Math.cos(i * angleInc - Math.PI/2) * pollock.radius;
				}

				return result;
			})
			.attr("cy", function(d,i){
				var result;
				if(useClocks)
					result = Math.sin(i*2 * angleInc - Math.PI/2) * pollock.radius;
				else
					result = Math.sin(i* angleInc - Math.PI/2) * pollock.radius;
				
				return result;
			}).append("title").text(function(d){
				return d + "kwh";
			});

		circGroup.transition().duration(750).attr("fill", function(d){ return pollock.colour(d);})
			.transition().duration(750).ease("quad-out").attr("r", function(d){
				return d * radiusMult ;
			});

		circGroup.exit()
			.transition().duration("750")
			.attr("r", 0)
			.attr("fill", "#FFFFFF")
			.remove();
	}
}