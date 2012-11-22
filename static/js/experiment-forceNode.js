nodeRibbon = function(sampleData, filtered)
{
	var w = 960;
    h = 500;
    fill = d3.scale.category20();

	nodes = [];
    links = [];

    var xTick;
    var yPos;

	if(!filtered)
	{
		//Concat data in one array
		for(var i = 500; i < sampleData.meterData.length/25 + 500; i++)
		{
			var lastNode;
			var firstNode;

			xTick = ((i + 500) / (sampleData.meterData.length/25 + 500)) * w;

			for(var j = 0; j <= sampleData.meterData[i].dayValues.length; j+=2)
			{
				var value = sampleData.meterData[i].dayValues[j];
				if(value == null)
					value = 0;

				node = {name:sampleData.meterData[i].date + "-" + j, group:i, x:0, y:0, radius:value*15};
				nodes.push(node);
				
				if(j == 0) {
					firstNode = node;
					lastNode = firstNode;
				 } 
				else if(j > 0 && j < sampleData.meterData.length){

				 	node.x = xTick;
				 	node.y = lastNode.y + value*15;

				 	links.push({source:node, target:lastNode, value:node.y - lastNode.y});


				 	console.log(xTick);

				 	lastNode = node;

				 	if(j >= sampleData.meterData[i].dayValues.length)
				 		links.push({source:node, target:firstNode, value:value*30});
				}



			}
		}

	} else {
		return;
	}


	
    

	var vis = d3.select(".graphArea").append("svg:svg")
	    .attr("width", w)
	    .attr("height", h);

	vis.append("svg:rect")
	    .attr("width", w)
	    .attr("height", h);

	var force = d3.layout.force()
	    .nodes(nodes)
	    .links(links)
	    .size([w, h])
	    .linkDistance(function(d) { return d.value; })
	    .linkStrength(5);

	var cursor = vis.append("svg:circle")
	    .attr("r", 30)
	    .attr("transform", "translate(-100,-100)")
	    .attr("class", "cursor");

	force.on("tick", function() {
	  vis.selectAll("line.link")
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });

	  vis.selectAll("circle.node")
	      .attr("cx", function(d) { return d.x; })
	      .attr("cy", function(d) { return d.y; })
	      .attr("r", function(d) { return d.radius; })
	      .style("fill", function(d) { return fill(d.group); })
	      .style("size", function(d) {return d.size});
	});

	vis.on("mousemove", function() {
	  cursor.attr("transform", "translate(" + d3.svg.mouse(this) + ")");
	});

	// vis.on("mousedown", function() {
	//   var point = d3.svg.mouse(this),
	//       node = {x: point[0], y: point[1]},
	//       n = nodes.push(node);

	//   // add links to any nearby nodes
	//   nodes.forEach(function(target) {
	//     var x = target.x - node.x,
	//         y = target.y - node.y;
	//     if (Math.sqrt(x * x + y * y) < 30) {
	//       links.push({source: node, target: target});
	//     }
	//   });

	//   restart();
	// });

	restart();

	function restart() {

	  vis.selectAll("line.link")
	      .data(links)
	    .enter().insert("svg:line", "circle.node")
	      .attr("class", "link")
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });

	  vis.selectAll("circle.node")
	      .data(nodes)
	    .enter().insert("svg:circle", "circle.cursor")
	      .attr("class", "node")
	      .attr("cx", function(d) { return d.x; })
	      .attr("cy", function(d) { return d.y; })
	      .attr("r", 5)
	      .call(force.drag);

	  force.start();
	}

}