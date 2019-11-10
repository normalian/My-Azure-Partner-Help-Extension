'use strict';

console.log('[Azure Portal Extention] start popup.js');

var authorizationToken;
var port = chrome.runtime.connect( { name: "my-background-port"} );
var default_config = {
  partnerId : '',
  partnerName : ''
};

$(function(){
	// console.log('[My Azure Partner Help Extention] @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
	port.postMessage({name: "get-subscriptions-accesstoken"});
	port.onMessage.addListener( response => {
		// take authorizationToken from background
		authorizationToken = response.authorizationToken;
		$('#accesstoken').val(authorizationToken);
	});

	$('#save_button').click( function(){
		var partnerId = $("#partnerId").val();
		var partnerName = $("#partnerName").val();
		var config = {
			partnerId: partnerId,
			partnerName: partnerName
		};
		chrome.storage.sync.set(config, function(){});
	});

	chrome.storage.sync.get(
		default_config,
		function(items) {
			$("#partnerId").val(items.partnerId);
			$("#partnerName").val(items.partnerName);
		}
	);
});
