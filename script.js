'use strict';

const dummySubscriptionId = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
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
		setTimeout( () => showMessageOnAzurePortalTopLoop(), 1000);
	}
}
showMessageOnAzurePortalTopLoop();

function doURICheckLoop() {
	if(window.location.href.indexOf('blade/Microsoft_Azure_Billing/SubscriptionsBlade') != -1
	){
		doUpdateSubscriptionlist();
	}
	setTimeout( () => doURICheckLoop(), 1000);
}
doURICheckLoop();

function doUpdateSubscriptionlist(){
	// console.log('[Azure Partner Help Extention] doUpdateSubscriptionlist()')

	// first element is header
	const resourceArray = jQuery('div.azc-grid-tableContainer.azc-br-muted table tr:not(:first)');
	resourceArray.each( (index, elem) => {
		var subscirptionIdElem = jQuery(elem).find('td.azc-grid-cell.azc-br-muted:nth-child(3)');
		const subscriptionIdText = jQuery(subscirptionIdElem).text();
		const subscriptionId = subscriptionIdText.substring(0, dummySubscriptionId.length);
		if(mpnIdMap[subscriptionId]){
			var updateText = subscriptionId + " - " + mpnIdMap[subscriptionId].partnerName;
			jQuery(subscirptionIdElem).text(updateText);
			// console.log("[Azure Partner Help Extention] doUpdateSubscriptionlist(): " + updateText);
			// There are no partners on this subscription or this extension hasn't still added a link into this DOM element
		}
		/*
		else if( mpnIdMap[subscriptionId] == null && subscriptionIdText.length == subscriptionId.length){
			var linkElem = jQuery("<a class='my-azure-partner-help-extension'></a>").text("Enable Partner Admin Link with your MPN ID");
			linkElem.click( function (){
				port.postMessage({
					name: "set-mpnid-function",
					subscriptionId : subscriptionId,
					partnerId : "1316820" //mpnIdMap[subscriptionId].partnerId
				});
			});
			jQuery(subscirptionIdElem).append(linkElem);
			console.log("[Azure Partner Help Extention] doUpdateSubscriptionlist(): add a link on " + jQuery(subscirptionIdElem).text());
		}
		*/
		//console.log("==================================================");
		//console.log(subscriptionId);
		//console.log(subscriptionIdText);
		//console.log(mpnIdMap);
		//console.log(mpnIdMap[subscriptionId]);
		//if(mpnIdMap[subscriptionId]) console.log(mpnIdMap[subscriptionId].partnerName);
		//if(mpnIdMap[subscriptionId]) console.log(subscriptionId.includes(mpnIdMap[subscriptionId].partnerName));
	});
}
