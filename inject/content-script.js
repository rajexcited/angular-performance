(function(chrome,AngularPerf){
	'use script';

// Copyright 2015

	log('content-script.js loading');

	var contentScript = AngularPerf.CONNECTION_NAME.CONTENTSCRIPT;
	var backgroundConnection = chrome.runtime.connect({
		name : contentScript
	});

	log('prepare for init message');	
	var messageToBG = AngularPerf.getMessageProtoType(contentScript);
	var sendMessage = function(info) {
		var msg = new messageToBG(info);
		backgroundConnection.postMessage(msg);
	};

	sendMessage({
		task: 'init'
	});

	log('message sent. Now listen message.');
	var taskexecutor = AngularPerf.getTaskCommunication(contentScript);
	backgroundConnection.onMessage.addListener(function bgMsgListener(message, sender, sendResponse)  {
		// in background message listener
	    log('bgMsgListener');
		// execute task
		var taskDetails = new taskexecutor(message, sender, sendResponse, backgroundConnection);
		log(taskDetails.getTabId());
	});

	function log(anymessage) {
		if(AngularPerf.debugMode) {
			console.log(anymessage);
		}
	}

})(chrome,AngularPerf);
