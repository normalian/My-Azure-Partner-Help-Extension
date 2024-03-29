'use strict';

var authorizationToken;
console.log('[Azure Partner Help Extention] start background.js');

chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
	var headers = details.requestHeaders;
	// don't check http headers except for portal.azure.com
	if( details.url.indexOf('portal.azure.com') == -1 ) return;
	for( var i = 0, l = headers.length; i < l; ++i ) {
		if (headers[i].name === 'Authorization') {
			if( !authorizationToken || authorizationToken !== details.requestHeaders[i].value ){
				authorizationToken = details.requestHeaders[i].value;
			}
			break;
		}
	}
	return {requestHeaders: details.requestHeaders};
}, {urls: [ '<all_urls>' ]},['requestHeaders','blocking']);

// return authorizationToken and partnerId list to scripts.js
chrome.runtime.onConnect.addListener( port => {
	var subResourceMap = {};
	console.log('[Azure Portal Extention] background.js#addListener: ' + port.name);
	port.onMessage.addListener( arg => {
		if( arg.name == "get-subscriptions-accesstoken" ){
			jQuery.ajax({
				type: 'GET',
				headers: {
					'Authorization': authorizationToken,
					'Content-Type': 'application/json'
				},
				url: "https://management.azure.com/subscriptions?api-version=2014-04-01-preview"
			}).then( response => {
				// console.log(JSON.stringify(response));
				port.postMessage( {
					name: "get-access-function",
					authorizationToken: authorizationToken,
					subscriptions: response.value
				});
			});
			return true;
		}else if( arg.name == "get-mpnids-function"){
			//console.log("################################# get-mpnids-function");
			$.ajax({
				type: 'GET',
				headers: {
				 'Authorization': authorizationToken,
				 'Content-Type': 'application/json'
				},
				// https://docs.microsoft.com/en-us/rest/api/resources/resourcegroups#ResourceGroups_List
				url: 'https://s2.billing.ext.azure.com/api/Billing/Subscription/GetPartnerInformation'
					+ '?api-version=2019-01-14'
					+ '&subscriptionGuid=' + arg.subscriptionId
			}).done( function( response ){
				// {"partnerId":"your MPN ID","partnerName":"your partner name"}
				//console.log("################################# get-mpnids-function#response start");
				//console.log(response);
				port.postMessage( {
					name: "get-mpnids-function",
					subscriptionId : arg.subscriptionId,
					partnerId : response.partnerId,
					partnerName : response.partnerName
				});
			});
			return true;
		}else if( arg.name == "validate-mpnid-function"){
			// Request URL: https://s2.billing.ext.azure.com/api/Billing/Subscription/ValidatePartnerId?api-version=2019-01-14
                        // {"subscriptionGuid":"subscription ID","partnerId":"your partnerid"}
                        // {"partnerId":"your partnerid","partnerName":"your partner name"}
						// {"message":"Unable to access the partner information at the moment. Please try again later.","httpStatusCode":"NotFound","xMsServerRequestId":null,"stackTrace":null}
						$.ajax({
							type: 'POST',
							headers: {
								'Authorization': authorizationToken,
								'Content-Type': 'application/json'
							},
							data: JSON.stringify({
								"subscriptionGuid" : arg.subscriptionId,
								"partnerId": arg.partnerId
							}),
							// https://docs.microsoft.com/en-us/rest/api/resources/resourcegroups#ResourceGroups_List
							url: 'https://s2.billing.ext.azure.com/api/Billing/Subscription/ValidatePartnerId'
								+ '?api-version=2019-01-14'
								//+ '&subscriptionGuid=' + arg.subscriptionId
						}).done( function( response ){
							// {"partnerId":"your MPN ID","partnerName":"your partner name"}
							//console.log("################################# response start");
							//console.log(response);
							port.postMessage( {
								name: "validate-mpnid-function",
							});
						});
						return true;
		}else if( arg.name == "set-mpnid-function"){
			//console.log("################################# set-mpnid-function");
			$.ajax({
				type: 'POST',
				headers: {
					'Authorization': authorizationToken,
					'Content-Type': 'application/json'
				},
				data: JSON.stringify({
					"subscriptionGuid" : arg.subscriptionId,
					"partnerId": arg.partnerId
				}),
				// https://docs.microsoft.com/en-us/rest/api/resources/resourcegroups#ResourceGroups_List
				url: 'https://s2.billing.ext.azure.com/api/Billing/Subscription/SetPartnerInformation'
					+ '?api-version=2019-01-14'
					//+ '&subscriptionGuid=' + arg.subscriptionId
			}).done( function( response ){
				// {"partnerId":"your MPN ID","partnerName":"your partner name"}
				//console.log("################################# response start");
				//console.log(response);
				port.postMessage( {
					name: "set-mpnid-function",
				});
			});
			return true;
			// Post Request URL: https://s2.billing.ext.azure.com/api/Billing/Subscription/SetPartnerInformation?api-version=2019-01-14
			// {"subscriptionGuid":"5d716c43-37ab-4cb1-84c8-1e0e4de4086a","partnerId":"1316820"}
			// no response
		}
	});
});
