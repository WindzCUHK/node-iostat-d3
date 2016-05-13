(function () {
	"use strict";

	var UI = myApp.UI = {};

	UI.loadData = function (data) {

		// value index
		var i = 0;
		var valueHeader = ["%user", "%nice", "%system", "%iowait", "%steal", "%idle", "rrqm/s", "wrqm/s", "r/s", "w/s", "rsec/s", "wsec/s", "avgrq-sz", "avgqu-sz", "await", "svctm", "%util"];

		for (var i = 0; i < valueHeader.length; i++) {
			var margin = {top: 20, right: 20, bottom: 20, left: 50};
			var width = 720 - margin.left - margin.right;
			var height  = 480 - margin.top - margin.bottom;

			// canvas
			var svg = d3.select("#graph-block").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			// x,y scale
			var xScale = d3.time.scale()
				.range([0, width])
				.domain(d3.extent(data, function(d) { return d.dateTime; }));
			var yScale = d3.scale.linear()
				.range([height, 0])
				.domain(d3.extent(data, function(d) { return d.values[i]; }));

			// x,y axis
			var xAxis = d3.svg.axis()
				.scale(xScale)
				.orient("bottom");
			var yAxis = d3.svg.axis()
				.scale(yScale)
				.orient("left");

			// data to line
			var lineFunction = d3.svg.line()
				.x(function(d) { return xScale(d.dateTime); })
				.y(function(d) { return yScale(d.values[i]); });
			// draw line as path
			var line = svg.append("g")
				.append("path")
				.datum(data)
				.attr("class", "line")
				.attr("d", lineFunction);

			// draw x,y axis
			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis)
			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
			
			// graph header
			svg.append("g").append("text")
				.attr("class", "title")
				.attr("x", width / 2)
				.style("text-anchor", "middle")
				.text(valueHeader[i]);

			// draw marker line and text
			var bisect = d3.bisector(function(d) { return d.dateTime; }).right;
			var yPosition = height / 3;
			[1460068550821-18555, 1460068570840-20011, 1460068591028-20183].forEach(function (dateTime, index) {
				var xPosition = xScale(dateTime);
				svg.append("g").append("line")
					.attr("class", "marker")
					.attr({
						x1: xPosition,
						x2: xPosition,
						y1: 0,
						y2: height
					})
					.style("stroke", "red")
					.style("stroke-width", 0.1);

				var yValue = data[bisect(data, dateTime)].values[i];
				svg.append("g").append("text")
					.attr("class", "marker-text")
					.attr("x", xPosition)
					.attr("y", yPosition + index * 15)
					.style("text-anchor", "middle")
					.text(yValue);
			});
		}
	};

	myApp._init(false, UI.loadData, this, [JSON.parse(ioStatJson)]);
})();
