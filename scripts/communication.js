(function(chrome,privates) {
	'use strict';

	var perf = window.AngularPerf = {
					CONNECTION_NAME : {
						DEVTOOL : 'devtools-page',
						BACKGROUND : 'background',
						CONTENTSCRIPT : 'content-script'
					},
					debugMode : true
				};

	log('communication.js loading');
	
	var basicProtoTask = function() {
		var debugMode = perf.debugMode;
		
		// retrieve tabId from any connection message
		this.getTabId = function() {
			// devtools always get from inpected tab or message
			return this.message.tabId || (this.connectingPort.sender.tab && this.connectingPort.sender.tab.id);
		};

		// log message task 
		this.log = function() {
			this.logger(this.message.log || this.message);
		};

		// task logger used by any
		this.logger = function (messageLog) {
			if(debugMode) {
				console.log(messageLog);
			}
		}

	};

// used for any
	var basicConstructor = function () {
		var message = this.message = arguments[0][0];
		this.sender= arguments[0][1];
		this.sendResponse = arguments[0][2];
		this.connectingPort = arguments[0][3];
		var destPort = arguments[0][4];
		var cb = arguments[0][5];

		// log(' basicConstructor Context:');
		// log(this);
		// execute task for given destination
		if(message.task && this[message.task]) {
			if(!destPort || destPort === this.connectingPort) {
				this[message.task].apply(this,cb);
			} else {
				log('posting message to destPort acting as a median');
				destPort.postMessage(message);
			}
		}

	};

// create extecutable task base prototype for devtools
	var devtoolsProtoTask = function() {
		// task function
		this.init = function(cb) {
			// if content script is loaded, ask
			if(typeof cb === 'function') 
				cb('init');
		};
	};

	var devtoolsTask = function() {
		basicConstructor.call(this,arguments);
	};
	
	devtoolsProtoTask.prototype = new basicProtoTask;
	devtoolsTask.prototype = new devtoolsProtoTask;
	devtoolsTask.prototype.constructor = devtoolsTask;
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
/////////////           CONTENT   SCRIPT    //////////////////////////////
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
// create extecutable task base prototype for content scripts
	var contentScriptProtoTask = function() {
		// task function
	};

	var contentScriptTask = function() {	
		basicConstructor.call(this,arguments);
	};
	
	contentScriptProtoTask.prototype = new basicProtoTask;
	contentScriptTask.prototype = new contentScriptProtoTask;
	contentScriptTask.prototype.constructor = contentScriptTask;

	perf.getTaskCommunication = function (channel) {
		var commun = function(){};
		if(channel===perf.CONNECTION_NAME.DEVTOOL) {
			commun = devtoolsTask;
		} else if(channel===perf.CONNECTION_NAME.CONTENTSCRIPT) {
			commun = contentScriptTask;
		}

		return commun;
	};

// message constructor
	var messageImpl = function (object) {
		this.task = undefined;
		this.tabId = chrome.devtools && chrome.devtools.inspectedWindow && chrome.devtools.inspectedWindow.tabId;
		// this.dest = channel;
		if(object) {
			// add given object to new message
			var props = Object.getOwnPropertyNames(object);
			var prop;
			for(var i=0,l=props.length;i<l;i++) {
				prop = props[i];
				this[prop] = object[prop];
			}
		}
		
		// this.source=channel;
	};

	perf.getMessageProtoType = function(channel,dest) {
		perf.CONNECTION_NAME.BACKGROUND;
		return function message(extraMsg) {
			this.source = channel;
			this.dest = dest || perf.CONNECTION_NAME.BACKGROUND;
			this.name = 'message';
			messageImpl.call(this,extraMsg);
		};
	};

	
	function log(anymessage) {
		if(perf.debugMode) {
			console.log(anymessage);
		}
	}

})(chrome);