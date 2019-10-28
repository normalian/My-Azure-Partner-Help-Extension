'use strict';

var authorizationToken = null;
var subscriptions = null;
var mpnIdMap = {};

console.log('[Azure Partner Help Extention] start script.js');
var port = chrome.runtime.connect( { name: "my-background-port"} );

// This delay process is important to add elements on Azure portal for delay read.
function showMessageOnAzurePortalTopLoop() {
	var elem = jQuery('div.fxs-startboard-layout.fxs-flowlayout');
	if( elem.length > 0 ){
		port.postMessage({name: "get-subscriptions-accesstoken"});
		port.onMessage.addListener( response => {
			// console.log('[Azure Partner Help Extention] returned values are below');

			if(response.name == "get-access-function"){
				// take authorizationToken from background
				authorizationToken = response.authorizationToken;
				subscriptions = response.subscriptions;

				for(var i=0; i<response.subscriptions.length; i++)
				{
					port.postMessage({
						name: "get-mpnids-function",
						subscriptionId : subscriptions[i].subscriptionId
					});
				}

			}else if(response.name == "get-mpnids-function"){
				//console.log("################################# showMessageOnAzurePortalTopLoop()#get-mpnids-function start");
				//console.log(response);
				mpnIdMap[response.subscriptionId] = { 
					partnerId : response.partnerId,
					partnerName : response.partnerName
				};
				console.log(mpnIdMap);
				//console.log("################################# showMessageOnAzurePortalTopLoop()#get-mpnids-function end");
			}
		});
	}else{
		setTimeout( () => showMessageOnAzurePortalTopLoop(), 2000);
	}
}
showMessageOnAzurePortalTopLoop();

function doURICheckLoop() {
	if(window.location.href.indexOf('blade/Microsoft_Azure_Billing/SubscriptionsBlade') != -1
	){
		doUpdateSubscriptionlist();
	}
	setTimeout( () => doURICheckLoop(), 2000);
}
doURICheckLoop();

function doUpdateSubscriptionlist(){
	console.log('[Azure Partner Help Extention] doUpdateSubscriptionlist()')

	// first element is header
	const resourceArray = jQuery('div.azc-grid-tableContainer.azc-br-muted table tr:not(:first)');
	resourceArray.each( (index, elem) => {
		const subscriptionId = jQuery(elem).find('td.azc-grid-cell.azc-br-muted:nth-child(3)').text().toLowerCase();
		//console.log( "subscriptionId = " + subscriptionId);
		if(subscriptionId && mpnIdMap[subscriptionId]){
			var updateText = subscriptionId + " - " + mpnIdMap[subscriptionId].partnerName;
		}
		//console.log(updateText);
		jQuery(elem).find('td.azc-grid-cell.azc-br-muted:nth-child(3)').text(updateText)
	});
}
