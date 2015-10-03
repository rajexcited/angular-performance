(function(chrome) {
	'use strict';

	var background = this;

// page  reloads after long inactive state
	var connectionHolder = {
		'devtools-page' : {},
		'content-script' : {},
		'panel' : {},
		'tabs' : {}
	};
	var debug=true;

// Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.
	chrome.runtime.onInstalled.addListener(function onInstalledCallback(details) {
		console.log('onInstalledCallback: '+details.reason);
		// console.log(details);
		// on update or reload, cleanup and restart.
		
		// reload previous connections ?????
		// re-initialize all connection holders
		var connections = Object.keys(connectionHolder);
		for (var i=0, len=connections.length;i<len;i++) {
			connectionHolder[connections[i]] = {};
		}
	});


// Fired when a connection is made from either an extension process or a content script.
// on reload of page, reopen of page, new connection, etc.
	chrome.runtime.onConnect.addListener(function onConnectCallback(connectingPort) {
		console.log('onConnectCallback, connectingPort-' + connectingPort.name);
		console.log(connectingPort);
		
		var connectionName = connectingPort.name,
			i, l;

		var devtoolsMsgListener = function (message, sender, sendResponse) {
				console.log('devtoolsMsgListener');
				console.log(message);
				console.log(sender);
				console.log(sendResponse);
				// add connection
				var tabId = message.tabId;
				var devtoolConnections = connectionHolder[connectionName];
				if(tabId && devtoolConnections && !(tabId in devtoolConnections)) {
					devtoolConnections[tabId] = connectingPort;
				}

				// execute task
				new devtoolsTask(message, sender, sendResponse, connectingPort);
			};

		var contentScriptMsgListener = function (message, contentPort, sendResponse) {
				console.log('contentScriptMsgListener');
				console.log(message);
				console.log(contentPort);
				console.log(sendResponse);
				
				// execute task
				new contentScriptTask(message, contentPort, sendResponse, connectingPort);

			};

		var panelMsgListener = function (message, sender, sendResponse) {
				console.log('panelMsgListener');
				console.log(message);
				console.log(sender);
				console.log(sendResponse);
				// add connection
				// var tabId = sender.tab && sender.tab.id;
				// if(tabId && !tabId in connectionHolder[connectionName]) {
				// 	connectionHolder[connectionName][tabId] = connectingPort;
				// }
				switch(message.task) {
					case 'init' : // do nothing
					;
					case 'log' : console.log(message.log);
					default : // ignore
				}

			};

		var msgListener = {
				'devtools-page' : devtoolsMsgListener,
				'content-script' : contentScriptMsgListener,
				'panel' : panelMsgListener
			};

		var onDisconnectCallback = function (disconnectingPort) {
			var connection = connectionHolder[connectionName];
			var tabId = disconnectingPort.sender.tab && disconnectingPort.sender.tab.id;
			console.log('onDisconnectCallback, tabs#'+Object.keys(connection).length);
			// console.log(disconnectingPort);
			
			if(tabId && connection && tabId in connection) {
					delete connection[tabId];
			} else {
				// iterate through and delete
				var tab = Object.keys(connection);
				for(i=0,l=tab.length; i<l;i++) {
					if(connection[tab[i]] === disconnectingPort) {
						delete connection[tab[i]];
						break;
					}
				}
			}

			// add connection
			var tabId = connectingPort.sender.tab && connectingPort.sender.tab.id;
			if(tabId && !(tabId in connectionHolder[connectionName])) {
				connectionHolder[connectionName][tabId] = connectingPort;
			}
			
			// cleanup for disconnectingPort
			disconnectingPort.onMessage.removeListener(msgListener[connectionName]);
			console.log('After DisconnectCallback, tabs#'+Object.keys(connection).length);
		};

	// Bind connection
		connectingPort.onMessage.addListener(msgListener[connectionName]);
		connectingPort.onDisconnect.addListener(onDisconnectCallback);
		// following cole log gives error for devtools
		// console.log('connectingPort.name: '+connectingPort.name+', connectingPort.sender.tab.id: '+connectingPort.sender.tab.id+', connectingPort.sender.tab.url: '+connectingPort.sender.tab.url);
	});

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
		this.message = arguments[0][0];
		this.sender= arguments[0][1];
		this.sendResponse = arguments[0][2];
		this.connectingPort = arguments[0][3];
		
		if(this.message.task && this[this.message.task]) {
			var tabId = this.getTabId();
			var destPort = connectionHolder.tabs[tabId] && connectionHolder.tabs[tabId][this.message.dest];
			if(!destPort) {
				this[this.message.task].apply(this);
			} else {
				destPort.postMessage(this.message);
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


// Fired when a message is sent from either an extension process or a content script.

	// chrome.runtime.onMessage.addListener(function onMessageCallback(message, sender, sendResponse) {
	// 	console.log('onMessageCallback');
	// 	console.log(message);
	// 	console.log(sender);
	// 	console.log(sendResponse);
	// });

	var isDebugMode = true;
	var commun = AngularPerf.getTaskCommunication(AngularPerf.CONNECTION_NAME.DEVTOOL);
	// console.log(commun.caller);
	console.log(commun.constructor);
	console.log(commun.init);
	console.log(commun.initTabConnection);

	var msg= AngularPerf.getMessageProtoType(AngularPerf.CONNECTION_NAME.DEVTOOL);
	console.log(msg);
	console.log(msg.prototype);
	console.log(Object.getOwnPropertyNames(msg));

})(chrome,AngularPerf);