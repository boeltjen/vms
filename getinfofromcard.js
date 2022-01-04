var getBadgeInfo = function() {	
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
			reservationData["Category"] = (document.querySelectorAll(".actions")[0].parentElement.querySelectorAll(".category")[0] || {"innerText":""}).innerText.trim();
			reservationData["Queue"] = (document.querySelectorAll(".actions")[0].parentElement.querySelectorAll(".queue")[0] || {"innerText":""}).innerText.trim();
			
		} else {
			/*if the ticket is being called:*/
			reservationData["Category"] = (document.querySelectorAll(".category")[0] || {"innerText":""}).innerText.trim();
			reservationData["Queue"] = (document.querySelectorAll(".queue")[0] || {"innerText":""}).innerText.trim();
		}

		var bracketsCheckRegex = /\((.*?)\)/;		
		var tempQueueLocation = (reservationData["Queue"].match(bracketsCheckRegex) || [""]).pop();

		if((/councillor office/i).test(reservationData["Category"]) && tempQueueLocation) {
			reservationData["Category"] = tempQueueLocation;
		}

		if((/councillor/i).test(reservationData["Queue"])) {
			reservationData["Queue"] = reservationData["Queue"].substring(0,reservationData["Queue"].toLowerCase().indexOf(" - ward"));
		}

	}
	return reservationData;
}

var printbadgeinfo = function() {
	var reservationDataFound = getBadgeInfo();
	if(!reservationDataFound) {
		console.log("No Registration Data Displayed for Printing.\n\nPlease Select a Registration and Try Again.");
	} else {
		window.open('https://boeltjen.github.io/vms/printbadge.html?'+(new URLSearchParams(reservationDataFound)).toString(), 'PRINT', 'height=500,width=700');
	}
}

printbadgeinfo();

