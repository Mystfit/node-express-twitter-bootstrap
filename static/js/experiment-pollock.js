var width = 960,
    height = 500,
    radius = 200;

var svg;

init = function()
{
    svg = d3.select(".graphArea").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	  	.append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
}

getPowerData = function(timeType, startRange, endRange
){
	var url = "http://tringlightningbolt.com/";

	rangeValueQuery = function(){
		return url += 'dayValues'
					+ "?year=" + startRange.getFullYear()
					+ "&month=" + (startRange.getMonth() + 1)
					+ "&day=" + startRange.getDate()
					+ "&controlled=1";
	}

	rangeSumQuery = function(){
		return url += 'rangeSum'
					+ "?yearA=" + startRange.getFullYear()
					+ "&monthA=" + (startRange.getMonth() + 1)
					+ "&dayA=" + startRange.getDate()
					+ "&yearB=" + endRange.getFullYear()
					+ "&monthB=" + (endRange.getMonth() + 1)
					+ "&dayB=" + endRange.getDate()
					+ "&controlled=1";
	}
	
	d3.json((timeType == "day") ? rangeValueQuery() : rangeSumQuery(), function(json){
		(json.powerData.values != undefined) ? pollock(json.powerData, "values") : pollock(json.powerData, "sums");
	});   
}


pollock = function(sampleData, dataType)
{
	var color = d3.scale.ordinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

	svg.selectAll("circle").remove();
	svg.selectAll("path").remove();


	var pie = d3.layout.pie().sort(null).value(function(d){
		var result;
		(d.sum == undefined) ? result = d : result = d.sum;
		return result;
	});

	if(sampleData.values != undefined) sampleData = sampleData.values;

	var pieAngles = pie(sampleData);

	var arc = d3.svg.arc()
	    .innerRadius(0)
	    .outerRadius(radius - 20);

	var largest =0;
	var smallest = 0;
	console.log(largest, smallest);

	for(var ang in pieAngles)
	{
		var angle = pieAngles[ang];
		diff = angle.endAngle - angle.startAngle;
		
		if(largest == 0 && smallest == 0) smallest = largest = diff;
		if(Math.max(diff, largest) > largest) largest = diff;
		if(Math.min(diff, smallest) < smallest) smallest = diff;
	}


	for(var circ in pieAngles)
	{
		var angleObj = pieAngles[circ];
		var xStart = Math.cos(angleObj.startAngle - Math.PI/2) * radius;
		var yStart = Math.sin(angleObj.startAngle - Math.PI/2) * radius;
		var xEnd = Math.cos(angleObj.endAngle - Math.PI/2) * radius;
		var yEnd = Math.sin(angleObj.endAngle - Math.PI/2) * radius;
		var xMid = (xStart + xEnd) *0.5;
		var yMid = (yStart + yEnd) *0.5;
		var circRadius = distance(xStart, yStart, xEnd, yEnd) * 0.5;

		svg.append("circle")
			.data(pieAngles)
			.attr("cx", xMid)
			.attr("cy", yMid)
			.attr("r", 0)
			.attr("fill", function(d,i) { return color(i); })
			.transition().duration(750).attr("r", circRadius);
	}



	var path = svg.selectAll("path")
    	.data(pieAngles)
  		.enter().append("path")
    	.attr("fill", function(d, i) { return color(i); })
    	.attr("d", arc);
    d3.selectAll("input").on("change", change);

    function change() {
  		path = path.data(pieAngles); // update the data
  		path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
		svg.selectAll("circle").transition().duration(750).attrTween("r", arcTween); // redraw the arcs
	}

	function arcTween(a) {
		var i = d3.interpolate(this._current, a);
		this._current = i(0);
		return function(t) {
	    	return arc(i(t));
	  	};
	}

	



	// var path = svg.selectAll("path")
	//     .data(pie(sampleData.powerData.values))
	//   .enter().append("path")
	//     .attr("fill", function(d, i) { return color(i); })
	//     .attr("d", arc)
	//     .each(function(d) { this._current = d; }); // store the initial values

}

distance = function(x, y, x0, y0){
    return Math.sqrt((x -= x0) * x + (y -= y0) * y);
};

normalize = function(value, min, max){
	return (max - value) / (max - min);
}