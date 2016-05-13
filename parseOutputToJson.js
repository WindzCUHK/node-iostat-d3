
'use strict';

var fs = require('fs');

fs.readFile('./iostat_output.txt', 'utf8', function(err, data) {

	var logDatestringToDate = function (dateString, withMillisecond) {
		var dateFormatWithMs = (withMillisecond) ? /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2}),(\d{3}$)/ : /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/;
		var groups = dateFormatWithMs.exec(dateString);

		return (new Date(
			parseInt(groups[1]),
			parseInt(groups[2]) - 1, 	// month start with 0
			parseInt(groups[3]),
			parseInt(groups[4]),
			parseInt(groups[5]),
			parseInt(groups[6]),
			(withMillisecond) ? parseInt(groups[7]) : 0
		));
	};

	var ioStatJson = {};
	var statPattern = /^([\d-]+ [\d:]+) (sda)?\s+([\d\s\.]+)$/;
	var appendStat = function (state, stateKey, line) {

		// mark processed
		state[stateKey] = false;

		var groups = statPattern.exec(line);
		if (groups != null) {
			
			var dateTime = logDatestringToDate(groups[1], false).getTime();
			var valueGroupIndex = 3;
			var values = groups[valueGroupIndex].split(/\s+/).map(parseFloat);

			if (ioStatJson[dateTime] == null) {
				ioStatJson[dateTime] = values;
			} else {
				ioStatJson[dateTime] = ioStatJson[dateTime].concat(values);
			}

		} else {
			throw "unknown statPattern format";
		}

	};

	var emptyLine = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} $/;
	var hearder1 = /avg-cpu:  %user   %nice %system %iowait  %steal   %idle/;
	var hearder2 = /Device:         rrqm\/s   wrqm\/s     r\/s     w\/s   rsec\/s   wsec\/s avgrq-sz avgqu-sz   await  svctm  %util/;
	var state = {
		nextIsCpuStat: false,
		nextIsDeviceStat: false
	};
	data.split(/\r?\n/).forEach(function (line) {

		// header line
		try {

			if (emptyLine.test(line)) {
				return;
			} else if (hearder1.test(line)) {
				state.nextIsCpuStat = true;
				return;
			} else if (hearder2.test(line)) {
				state.nextIsDeviceStat = true;
				return;	
			} else if (Object.keys(state).map(function (k) { return state[k]; }).some(function (v) { return v; })) {

				if (state.nextIsCpuStat) appendStat(state, "nextIsCpuStat", line);
				if (state.nextIsDeviceStat) appendStat(state, "nextIsDeviceStat", line);

			} else {
				// unknown line skip
				throw "unknown format";
			}
		} catch (errType) {
			console.log("[%s] Encounter unknown line, skipped: %s", errType, line);
			return;
		}
	});

	// output to js file (not json !!!)
	var ioStatJsonArray = [];
	Object.keys(ioStatJson).forEach(function (k) {
		ioStatJsonArray.push({
			dateTime: k,
			values: ioStatJson[k]
		});
	});
	fs.writeFile('loadIoStatJson.js', 'var ioStatJson = \'' + JSON.stringify(ioStatJsonArray) + '\';', function (err) {
		if (err) throw err;
		console.log('ioStatJson write done.');
	});
});
