(function(chrome,AngularPerf) {
	'use strict';

// Copyright 2015

	var devtools = AngularPerf.CONNECTION_NAME.DEVTOOL;
	// Create a connection to the background page
	var backgroundConnection = chrome.runtime.connect({
	    name: devtools
	});
	
	var messageToBG = AngularPerf.getMessageProtoType(devtools);
	var sendMessage = function(info) {
		var msg = new messageToBG(info);
		backgroundConnection.postMessage(msg);
	};
	
	// default first message on inspect tab load
	sendMessage({
		task : 'init'
	});

	log('devtoolsPage.js loading - '+devtools);
	// create dev tool panel
	chrome.devtools.panels.create(
	    'Angular perfStats',
	    null, // No icon path
	    'panel/ngPerfStatsPanel.html',
	    null // no callback needed
	);
	
	log('panel loaded');
	// var msg2= AngularPerf.getMessageProtoType(AngularPerf.CONNECTION_NAME.CONTENTSCRIPT);
	var taskexecutor = AngularPerf.getTaskCommunication(devtools);
	log('prepare for message listener ');
	backgroundConnection.onMessage.addListener(function bgMsgListener(message, sender, sendResponse)  {
	    log('bgMsgListener');
		// log(message);
		// execute task
		var taskDetails = new taskexecutor(message, sender, sendResponse, backgroundConnection);
		log(taskDetails.getTabId());
	});
	
	// backgroundConnection.postMessage(new msg({ task : 'log', log:'test log.', dest: CONTENTSCRIPT_CONNECTION }));
	// proxy log to background
	function log(anymessage) {
		if(AngularPerf.debugMode) {
				sendMessage({
					task:'log',
					log:anymessage
				})
		}
	}

})(chrome,AngularPerf);