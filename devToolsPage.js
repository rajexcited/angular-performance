(function(chrome) {
	'use strict';

// Copyright 2015

	var DEVTOOL_CONNECTION = 'devtools-page',
		BACKGROUND_CONNECTION = 'background',
		CONTENTSCRIPT_CONNECTION = 'content-script';
	// console.log('devtools-page is loading');
	// create dev tool panel
	chrome.devtools.panels.create(
	    'ngPerfStats',
	    null, // No icon path
	    'panel/ngPerfStatsPanel.html',
	    null // no callback needed
	);

	// Create a connection to the background page
	var backgroundPageConnection = chrome.runtime.connect({
	    name: DEVTOOL_CONNECTION
	});

	// message constructor
	var message = function (object) {
		this.task = undefined;
		this.tabId = chrome.devtools.inspectedWindow.tabId;
		this.dest = BACKGROUND_CONNECTION;
		if(object) {
			// add given object to new message
			var props = Object.getOwnPropertyNames(object);
			var prop;
			for(var i=0,l=props.length;i<l;i++) {
				prop = props[i];
				this[prop] = object[prop];
			}
		}
		this.source=DEVTOOL_CONNECTION;
	};

	// backgroundPageConnection.onMessage.addListener(function (message) {
	    // Handle responses from the background page, if any
		// console.log(message);
	// });

	// Relay the tab ID to the background page
	// chrome.runtime.sendMessage({
	//     tabId: ,
	//     scriptToInject: "content_script.js"
	// });

// send init devtool message to get registered
	backgroundPageConnection.postMessage(new message({ task : 'log', log:'test log.', dest: CONTENTSCRIPT_CONNECTION }));
// }catch(e) {
// 	// console.log(e);
// }
})(chrome);
