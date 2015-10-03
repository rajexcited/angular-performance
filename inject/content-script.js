(function(){
	'use script';

	var backgroundPageConnection = chrome.runtime.connect({
		name : 'content-script'
	});
	
	// message constructor
	var message = function (object) {
		if(object) {
			return object;
		}
		this.task = undefined;		
	};

	// backgroundPageConnection.postMessage({
	// 	task: 'init'
	// });
	// chrome.runtime.sendMessage({
	//     scriptToInject: "init content_script"
	// })

})();
