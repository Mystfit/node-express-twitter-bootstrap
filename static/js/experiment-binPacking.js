stackedBoxes = function(sampleData){

    var scale = 100;

    var meterBlocks = [];
    for(var i = 0; i < sampleData.length; i++){
        meterBlocks.push({w:sampleData[i] * scale, h:sampleData[i]* scale});
    }

    //meterBlocks.sort(function(a,b) { return (b.w > a.w); });

	var packer = new GrowingPacker();
	packer.fit(meterBlocks);

	for(var n = 0 ; n < meterBlocks.length ; n++) {
		var block = meterBlocks[n];
		if (block.fit) {
	  		$("canvas").drawRect({
			  strokeStyle: "#000",
			  strokeWidth: 1,
			  x: block.fit.x + block.w*0.5, y: block.fit.y + block.h*0.5,
			  width: block.w,
			  height: block.h
			});
		}
	}

}