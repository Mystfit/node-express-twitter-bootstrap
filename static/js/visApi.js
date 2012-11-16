d3.json('getAverageDayValues', function(json){
	generateLayeredGraph(json, "average");
});

generateLayeredGraph = function(sampleData, type)
{
	var numLayers = 1;
	var _sampleData = [];
	var numTicks;

	var width = 960;
	var height = 500;

	if(type == "all"){
		//Concat data in one array
		for(var i = 0; i < sampleData.meterData.length; i++)
		{
			for(var j = 0; j < sampleData.meterData[i].dayValues.length; j++)
			{
				var value = sampleData.meterData[i].dayValues[j];
				if(value == null)
					value = 0;
				_sampleData.push(value);
			}
		}

		sampleData = _sampleData;
		numTicks = sampleData.length / 730;

	} else if( type == "average") {
		sampleData = sampleData.meterData;
		numTicks = sampleData.length;

	}

	stack = d3.layout.stack();
	var layers0 = stack(d3.range(numLayers).map(function(){ 
		return sampleData.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
	}));
	var layers1 = stack(d3.range(numLayers).map(function(){ 
		return sampleData.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
	}));

	var x = d3.scale.linear()
    			.domain([0, sampleData.length - 1])
    			.range([0, width]);

    var y = d3.scale.linear()
    			.domain([0, d3.max(layers0.concat(layers1), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
    			.range([height, 0]);

	var colour = d3.scale.linear()
    			.domain([0, d3.max(layers0.concat(layers1), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
    			.range([height, 0]);

    var area = d3.svg.area()
			    .x(function(d) { return x(d.x); })
			    .y0(function(d) { return y(d.y0); })
			    .y1(function(d) { return y(d.y0 + d.y); });

	var svg = d3.select(".graphArea").append("svg")
			    .attr("width", width)
			    .attr("height", height);

	svg.selectAll("path")
			    .data(layers0)
			  	.enter().append("path")
			    .attr("d", area)
			    .style("fill", function() { return colour(Math.random()); });

	var xAxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom")
                  .ticks(numTicks);  //Set rough # of ticks

    svg.append('g').attr('class', 'axis')
    			.call(xAxis);

    function transition() {
		d3.selectAll("path")
					.data(function() {
						var d = layers1;
						layers1 = layers0;
						return layers0 = d;
					})
					.transition()
					.duration(2500)
					.attr("d", area);
  	}

  	function bumpLayer(n) {

		function bump(a) {
		  	var x = 1 / (.1 + Math.random()),
		      	y = 2 * Math.random() - .5,
		      	z = 10 / (.1 + Math.random());
		    for (var i = 0; i < n; i++) {
		    	var w = (i / n - y) * z;
		    	a[i] += x * Math.exp(-w * w);
		    }
		}

		  var a = [], i;
		  for (i = 0; i < n; ++i) a[i] = 0;
		  for (i = 0; i < 5; ++i) bump(a);
		  return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
	}

}