(function(chrome) {
	'use strict';

	console.log('in communications');

	var perf = window.AngularPerf = {
		CONNECTION_NAME : {
			DEVTOOL : 'devtools-page',
			BACKGROUND : 'background',
			CONTENTSCRIPT : 'content-script'
		},
		debugMode : true
	};

	var basicProtoTask = function() {

		this.initTabConnection = function() {
			var tabId = this.getTabId();
			connectionHolder.tabs[tabId] = connectionHolder.tabs[tabId] || {};
			connectionHolder.tabs[tabId][this.connectingPort.name] = connectingPort;
		};
		
		this.getTabId = function() {
			return (this.connectingPort.sender.tab && this.connectingPort.sender.tab.id) || (this.message.tabId);
		};

		this.log = function() {
			if(isDebugMode) {
				console.log(this.message.log);
			}
		};

	};

	var basicConstructor = function () {
		var message = this.message = arguments[0][0];
		this.sender= arguments[0][1];
		this.sendResponse = arguments[0][2];
		this.connectingPort = arguments[0][3];
		
		if(message.task && this[message.task]) {
			var tabId = this.getTabId();
			var destPort = connectionHolder.tabs[tabId] && connectionHolder.tabs[tabId][message.dest];
			if(!destPort) {
				this[message.task].apply(this);
			} else {
				destPort.postMessage(message);
			}
		}

	};

// create extecutable task base prototype for devtools
	var devtoolsProtoTask = function() {
		// task function
		this.init = function() {
			// if content script is loaded, ask
			this.initTabConnection();
		};
	};

	var devtoolsTask = function() {
		basicConstructor.call(this,arguments);
	};
	
	devtoolsProtoTask.prototype = new basicProtoTask;
	devtoolsTask.prototype = new devtoolsProtoTask;
	devtoolsTask.prototype.constructor = devtoolsTask;

// create extecutable task base prototype for devtools
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
		var commun;
		if(channel===perf.CONNECTION_NAME.DEVTOOL) {
			commun = Object.create(devtoolsTask.prototype);
		} else if(channel===perf.CONNECTION_NAME.CONTENTSCRIPT) {
			commun = Object.create(contentScriptTask.prototype);
		}

		return commun;
	};


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

// message constructor
	var message = function (object) {
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

	perf.getMessageProtoType = function(channel) {
		Object.defineProperty(message,'channel', {
	    	get : function() {    return channel;  }
		});
		return message;
	}
})(chrome);