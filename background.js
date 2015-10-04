(function(chrome,AngularPerf) {
	'use strict';

// page  reloads after long inactive state
	var connectionHolder = {
		'devtools-page' : {},
		'content-script' : {},
		'panel' : {},
		'tabs' : {}
	};

	log('background.js loading');

// Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.
	chrome.runtime.onInstalled.addListener(function onInstalledCallback(details) {
		log('onInstalledCallback: '+details.reason);
		// log(details);
		// on update or reload, cleanup and restart.
		
		// reload previous connections ?????
		// re-initialize all connection holders
		var connections = Object.keys(connectionHolder);
		for (var i=0, len=connections.length;i<len;i++) {
			var conn = connectionHolder[connections[i]];
			if(Object.getOwnPropertyNames(conn).length !== 0) {
				// remove existing connections or reset all
			}
			// init
			//connectionHolder[connections[i]] = {}; 			
		}
	});


// Fired when a connection is made from either an extension process or a content script.
// on reload of page, reopen of page, new connection, etc.
	chrome.runtime.onConnect.addListener(function onConnectCallback(connectingPort) {
		log('onConnectCallback, connectingPort-' + connectingPort.name);
		//log(connectingPort);
		
		var connectionName = connectingPort.name,
			i, // iterator index
			l,	// length
			taskexecutor = AngularPerf.getTaskCommunication(connectionName),
			portConnections = connectionHolder[connectionName];
		
		// retrieve tabId from any connection message
		function getTabId(message) {
			// devtools always get from inpected tab or message
			return (message && message.tabId) || (connectingPort.sender.tab && connectingPort.sender.tab.id);
		};

		// add connection to tabs and connection channel
		var saveConnection = function(tabId) {
				if(tabId && portConnections && !(tabId in portConnections)) {
					portConnections[tabId] = connectingPort;
					var tabIdConnections = connectionHolder.tabs[tabId];
					if(!tabIdConnections) {
						// not exists - undefined
						tabIdConnections = new Object;
						tabIdConnections[connectionName] = connectingPort;
						connectionHolder.tabs[tabId] = tabIdConnections;
					} else {
						// exists - add connection to tab
						tabIdConnections[connectionName] = connectingPort;
					}
				}
				///////////////////////   end: added connection
			};

		var devtoolsMsgListener = function (message, sender, sendResponse) {
				log('devtoolsMsgListener');
				// log(message);
				// log(sender);
				// log(sendResponse);
				
				// handles first message to initiate
				function initCallback(task) {
					// do nothing
				}
				

				var tabId = getTabId(message);
				var destPort = message.dest && connectionHolder.tabs[tabId] && connectionHolder.tabs[tabId][message.dest];
				// execute task
				var taskDetails = new taskexecutor(message, sender, sendResponse, connectingPort,destPort, initCallback);
				saveConnection(tabId);

			};

		var contentScriptMsgListener = function (message, contentPort, sendResponse) {
				log('contentScriptMsgListener');
				// log(message);
				// log(contentPort);
				// log(sendResponse);
				
				var tabId = getTabId(message);
				var destPort = message.dest && connectionHolder.tabs[tabId] && connectionHolder.tabs[tabId][message.dest];
				// execute task
				var taskDetails = new taskexecutor(message, contentPort, sendResponse, connectingPort,destPort);
				saveConnection(tabId);
			};

		var panelMsgListener = function (message, sender, sendResponse) {
				log('panelMsgListener');
				// log(message);
				// log(sender);
				// log(sendResponse);

				var tabId = getTabId(message);
				var destPort = message.dest && connectionHolder.tabs[tabId] && connectionHolder.tabs[tabId][message.dest];
				// execute task
				var taskDetails = new taskexecutor(message, sender, sendResponse, connectingPort,destPort);
				saveConnection(tabId);
			};

		var msgListener;
		if(connectionName === AngularPerf.CONNECTION_NAME.DEVTOOL) {
			msgListener = devtoolsMsgListener;
		} else if(connectionName === AngularPerf.CONNECTION_NAME.CONTENTSCRIPT) {
			msgListener = contentScriptMsgListener;
		} else if(connectionName === AngularPerf.CONNECTION_NAME.PANEL) {
			msgListener = panelMsgListener;
		} else {
			// ignore
		}

		var onDisconnectCallback = function (disconnectingPort) {
			var tabId = disconnectingPort.sender.tab && disconnectingPort.sender.tab.id;
			log('onDisconnectCallback, tabs#'+Object.keys(portConnections).length);
			// log(disconnectingPort);
			
			// delete connection
			if(tabId && portConnections && (tabId in portConnections)) {
				delete portConnections[tabId];
				delete connectionHolder.tabs[tabId][connectionName];
			} else {
				// iterate through and delete
				var tabs = Object.keys(portConnections), tab;
				for(i=0,l=tabs.length; i<l;i++) {
					tab = tabs[i];
					if(portConnections[tab] === disconnectingPort) {
						delete portConnections[tab];
						delete connectionHolder.tabs[tab][connectionName];	
						break;
					}
				}
			}
			///////////////  end : deleting connection

			// cleanup for disconnectingPort
			disconnectingPort.onMessage.removeListener(msgListener);
			log('After DisconnectCallback, tabs#'+Object.keys(portConnections).length);
		};

	// Bind connection,  message, events
		connectingPort.onMessage.addListener(msgListener);
		connectingPort.onDisconnect.addListener(onDisconnectCallback);
		// following cole log gives error for devtools
		// log('connectingPort.name: '+connectingPort.name+', connectingPort.sender.tab.id: '+connectingPort.sender.tab.id+', connectingPort.sender.tab.url: '+connectingPort.sender.tab.url);
	});

	
// Fired when a message is sent from either an extension process or a content script.

	// chrome.runtime.onMessage.addListener(function onMessageCallback(message, sender, sendResponse) {
	// 	log('onMessageCallback');
	// 	log(message);
	// 	log(sender);
	// 	log(sendResponse);
	// });

	function log(anymessage) {
		if(AngularPerf.debugMode) {
			console.log(anymessage);
		}
	}

})(chrome,AngularPerf);