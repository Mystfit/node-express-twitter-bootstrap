pollock = function(sampleData, filtered, dataType)
{
	var w = 960;
    h = 500;
    fill = d3.scale.category20();

	nodes = [];
    links = [];

    var xTick;
    var yPos;


    sampleData = sampleData.powerData;



	if(!filtered)
	{
		if(dataType == 'rangedhalfday')
		{
			for(var day = 0; day < sampleData.length; day++)
			{
				console.log(day);
				for(var i = 0; i < sampleData[day].values.length; i++)
				{
					var value = sampleData[day].values[i];
					if(value == null)
						value = 0;

					console.log(value);


					node = {group:day, x:(i / sampleData[day].values.length) * w, y:value/5 * h, radius:value*20, strength:5};
					nodes.push(node);

					
					if(i == 0) {
						node.fixed = true;
						//node.x = 0 + 20;
						node.y = node.y + h * 0.5;
						firstNode = node;
						lastNode = firstNode;
					 } 

					else if(i > 0 && i < sampleData[day].values.length){

					 	//node.x = xTick;
					 	//node.y = lastNode.y + value*15;

					 	var dist = Math.sqrt(Math.pow(node.x - lastNode.x, 2) + Math.pow(node.y - lastNode.y, 2)) * 0.1;


					 	links.push({source:node, target:lastNode, value:dist });
					 	lastNode = node;

					 	console.log(node);

					 	if(node.value == undefined)
					 		node.value = 0;

					 	if(day > 0){
					 		links.push({
					 			source:node, 
					 			target:nodes[(day-1)*sampleData[day].values.length + i], 
					 			value:node.radius*2 + 2
					 		 });
					 	}

					 	//Connect last node to first node
					 	if(i == sampleData[day].length-1){

					 		node.fixed=true;
					 		//node.x = w - 20;
					 		node.y = node.y + h * 0.5;

				 		//links.push({source:node, target:firstNode, value:value*30});
					 	}

					} 


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
	    .gravity(0.1)
	    .linkDistance(function(d) { return d.value; })
	    .linkStrength(function(d) { return 10; console.log(d.strength);});
	    

	var cursor = vis.append("svg:circle")
	    .attr("r", 30)
	    .attr("transform", "translate(-100,-100)")
	    .attr("class", "cursor");

	force.on("tick", function() {
	  vis.selectAll("line.link")
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; })
	      .attr("visible", false)
	      .style("lineStyle", '#fff');

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