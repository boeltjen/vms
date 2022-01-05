var getBadgeInfoFromCard = function() {	
	var reservationFieldDivParent = document.getElementsByClassName('reservation-field-values')[0];
	var reservationData = {};
	if(reservationFieldDivParent == undefined) {
		reservationData = false;
		console.log("No Badge Info Found");
	} else {
		reservationData = {};
		var reservationFieldDivs = reservationFieldDivParent.querySelectorAll(".item");
		reservationFieldDivs.forEach(function(itemDiv){
			var tempItemsArray = itemDiv.innerText.split(/\n/);
			reservationData[tempItemsArray[0]] = tempItemsArray[1] || "";
		});
		var tempDate = new Date();
		reservationData["currentDateStr"] = tempDate.toDateString().substr(0,10).replace(/ /g,"-").toUpperCase();
		reservationData["currentShortDateStr"] = tempDate.toDateString().substr(4,6).replace(/ /g,"-").toUpperCase();
		reservationData["currentTimeStr"] = tempDate.toTimeString().substr(0,5);
	
		if(document.querySelectorAll(".ticket").length > 0) {
			/*if the ticket is still waiting, but being previewed:*/
			reservationData["category"] = (document.querySelectorAll(".actions")[0].parentElement.querySelectorAll(".category")[0] || {"innerText":""}).innerText.trim();
			reservationData["queue"] = (document.querySelectorAll(".actions")[0].parentElement.querySelectorAll(".queue")[0] || {"innerText":""}).innerText.trim();
			reservationData["waitTimeMinutes"] = (document.querySelectorAll(".actions")[0].parentElement.querySelectorAll("[key='WaitTimeMinutes']")[0] || {"innerText":""}).innerText.trim().slice(0,-5);
			reservationData["reservationTimeStr"] = (document.querySelectorAll(".actions")[0].parentElement.querySelectorAll(".display-text")[0] || {"innerText":""}).innerText.trim();
			
		} else {
			/*if the ticket is being called:*/
			reservationData["category"] = (document.querySelectorAll(".category")[0] || {"innerText":""}).innerText.trim();
			reservationData["queue"] = (document.querySelectorAll(".queue")[0] || {"innerText":""}).innerText.trim();
			reservationData["waitTimeMinutes"] = (document.querySelectorAll("[key='WaitTimeMinutes']")[0] || {"innerText":""}).innerText.trim().slice(0,-5);
			reservationData["reservationTime"] = (document.querySelectorAll(".display-text")[0] || {"innerText":""}).innerText.trim();
		}

		var bracketsCheckRegex = /\((.*?)\)/;		
		var tempQueueLocation = (reservationData["queue"].match(bracketsCheckRegex) || [""]).pop();

		if((/councillor office/i).test(reservationData["category"]) && tempQueueLocation) {
			reservationData["category"] = tempQueueLocation;
		}

		if((/councillor/i).test(reservationData["queue"])) {
			reservationData["queue"] = reservationData["queue"].substring(0,reservationData["queue"].toLowerCase().indexOf(" - ward"));
		}

	}
	return reservationData;
}

var createUrlSearchString = function(paramObj,stripWhiteAndLowerCaseParams) {
	var returnString = "";
	for (var key in paramObj) {
		if(stripWhiteAndLowerCaseParams || false) {
			let tempKey = key.toString().replace(/\s/g,"").toLowerCase();
			returnString += encodeURIComponent(tempKey) + "=" + encodeURIComponent(paramObj[key]) + "&";
		} else {
			returnString += encodeURIComponent(key) + "=" + encodeURIComponent(paramObj[key]) + "&";
		}
	}
	return returnString.slice(0, -1);
}

var printbadgeinfo = function() {
	var reservationDataFound = getBadgeInfoFromCard();
	if(!reservationDataFound) {
		alert("No Registration Data Displayed for Printing.\n\nPlease Select a Registration and Try Again.");
	} else {
		window.open('https://boeltjen.github.io/vms/printbadge.html?'+createUrlSearchString(reservationDataFound,true), 'PRINT', 'height=500,width=700');
	}
}
