var getBadgeInfoFromApi = function() {
	return new Promise((resolve,reject) => {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		var tempAuthToken = "";
		var ticketsData = {};
		var ticketKey = "";
		var ticketCardElements = document.querySelectorAll("[class^='ticket-'].ticket");
		if(ticketCardElements.length) {
			ticketCardElements.forEach(function(ticketCard) {
				if(ticketCard.querySelectorAll(".actions").length) {
					ticketKey = ticketCard.className.match(/ticket-([a-zA-Z0-9-]*)/i)[1];				
				}
			});
		} else {
			var pathnameArray = window.location.pathname.split("/");
			ticketKey = pathnameArray[pathnameArray.length-1];
		}
		if(!ticketKey) {
			reject("No Registration Data Displayed for Printing.\n\nPlease Select a Registration and Try Again.");
			return false;
		}
		var employeeId = JSON.parse(localStorage.getItem("employee")).employeeId;

		var addReservationDataToTicket = function(ticketId) {

			return new Promise((resolve,reject) => {
				var reservationsXhr = new XMLHttpRequest(); 
				reservationsXhr.onreadystatechange = function() {

					if (this.readyState == 4 && this.status == 200) {
						var responseObj = JSON.parse(this.responseText); 
						var singleResDataRaw = responseObj.data;
						let singleResObj = {};
						singleResDataRaw.forEach(function(fieldObj) {
							singleResObj[fieldObj.fieldName] = fieldObj.fieldValue;
							ticketsData[ticketId][fieldObj.fieldName] = fieldObj.fieldValue;
						});
						resolve(true);
						return;
					} 
					else if ( this.status > 299 && this.readyState == 4) {
						console.log({reservationsXhr});
						reject('ServerError:' + reservationsXhr.statusText);
						return;
					} 
					else reservationsXhr.onerror = function() {
						console.log({reservationsXhr}); 
						reject('RequestError' + reservationsXhr.responseText);
						return;						
					} 
				};

				reservationsXhr.open("GET", encodeURI("https://counter-api.frontdesksuite.ca/api/v1/reservations/reservation-field-values?reservationId=" + ticketsData[ticketId].reservation.reservationId)); 

				reservationsXhr.setRequestHeader('Authorization', 'Bearer ' + tempAuthToken);
				reservationsXhr.setRequestHeader('fd_emp_id', employeeId);
				reservationsXhr.send();
			});
		};



		var addQueueDataToTicket = function(ticketId) {

			return new Promise((resolve,reject) => {
				var waitingTicketsXhr = new XMLHttpRequest(); 
				waitingTicketsXhr.onreadystatechange = function() {

					if (this.readyState == 4 && this.status == 200) {
						var responseObj = JSON.parse(this.responseText); 
						var singleResDataRaw = responseObj.data;
						singleResDataRaw.forEach(function(waitingTicketObj) {
							if(waitingTicketObj.ticketId == ticketId) {
								ticketsData[ticketId]["category"] = waitingTicketObj.queueCategoryName;
								ticketsData[ticketId]["queue"] = waitingTicketObj.queueName;
								ticketsData[ticketId]["reservationTime"] = (new Date(waitingTicketObj.reservationTime)).toTimeString().substr(0,5);
								ticketsData[ticketId]["createTime"] = (new Date(waitingTicketObj.createdAt)).toTimeString().substr(0,5);
							
								var bracketsCheckRegex = /\((.*?)\)/;		
								var tempQueueLocation = (ticketsData[ticketId]["queue"].match(bracketsCheckRegex) || [""]).pop();

								if((/councillor office/i).test(ticketsData[ticketId]["category"]) && tempQueueLocation) {
									ticketsData[ticketId]["category"] = tempQueueLocation;
								}

								if((/councillor/i).test(ticketsData[ticketId]["queue"])) {
									ticketsData[ticketId]["queue"] = ticketsData[ticketId]["queue"].substring(0,ticketsData[ticketId]["queue"].toLowerCase().indexOf(" - ward"));
								}
								var tempDate = new Date();
								ticketsData[ticketId]["currentDateStr"] = tempDate.toDateString().substr(0,10).replace(/ /g,"-").toUpperCase();
								ticketsData[ticketId]["currentShortDateStr"] = tempDate.toDateString().substr(4,6).replace(/ /g,"-").toUpperCase();
								ticketsData[ticketId]["currentTimeStr"] = tempDate.toTimeString().substr(0,5);
							}
						});
						resolve(true);
						return;						
					} 
					else if ( this.status > 299 && this.readyState == 4) {
						console.log({waitingTicketsXhr});
						reject('ServerError:' + waitingTicketsXhr.statusText);
						return;
					} 
					else waitingTicketsXhr.onerror = function() {
						console.log({waitingTicketsXhr}); 
						reject('RequestError' + waitingTicketsXhr.responseText);
						return;					
					} 
				};

				waitingTicketsXhr.open("GET", encodeURI("https://counter-api.frontdesksuite.ca/api/v1/tickets/waiting-tickets")); 

				waitingTicketsXhr.setRequestHeader('Authorization', 'Bearer ' + tempAuthToken);
				waitingTicketsXhr.setRequestHeader('fd_emp_id', employeeId);

				waitingTicketsXhr.send();
			});
		};



		var ticketsXhr = new XMLHttpRequest(); 
		ticketsXhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var responseObj = JSON.parse(this.responseText); 
				var rawTick = responseObj.data;
				var resPromisesToCall = [];

				let lastOperation = rawTick.operations[rawTick.operations.length-1];
				let tickDataEle = {
					"id":rawTick.ticketId,
					"reservationTimeStr":rawTick.displayText,
					"queueCategoryId" :	lastOperation.queueCategoryId,
					"queueId" :	lastOperation.queueId,
					"reservation" : rawTick.reservation,
					"state" : rawTick.state

				};
				switch (tickDataEle.state) {
					case 1:
						tickDataEle.stateString = "waiting";
						break;
					case 2:
						tickDataEle.stateString = "tbd";
						break;
					case 3:
						tickDataEle.stateString = "ended";							
						break;
					default:
						tickDataEle.stateString = "undetermined";
				}
				if (tickDataEle.reservation) {
					ticketsData[tickDataEle.id] = tickDataEle;
					resPromisesToCall.push(addReservationDataToTicket(tickDataEle.id));
					resPromisesToCall.push(addQueueDataToTicket(tickDataEle.id));
				}
				Promise.all(resPromisesToCall).then(()=>{
					let ticketsDataArray = [];
					for (var n in ticketsData) ticketsDataArray.push(ticketsData[n]);
					//currently only providing the single open card ticket
					resolve(ticketsDataArray[0]);
					return;
				}).catch((errorMessages)=> {
					reject(errorMessages);
					return;
				});	
			} 
			else if ( this.status > 299 && this.readyState == 4) {
				console.log(ticketsXhr);
				reject('ServerError:' + ticketsXhr.statusText);
				return;				
			} 
			else ticketsXhr.onerror = function() {
				console.log(ticketsXhr);
				reject('RequestError' + ticketsXhr.responseText);
				return;
			} 
		};


		var authTokenXhr = new XMLHttpRequest(); 
		authTokenXhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var responseObj = JSON.parse(this.responseText); 
				tempAuthToken = responseObj.token;
				ticketsXhr.open("GET", encodeURI("https://counter-api.frontdesksuite.ca/api/v1/tickets/" + ticketKey)); 
				ticketsXhr.setRequestHeader('Authorization', 'Bearer ' + tempAuthToken);
				ticketsXhr.setRequestHeader('fd_emp_id', employeeId);
				
				ticketsXhr.setRequestHeader("Content-type","application/json");
				ticketsXhr.send(); 
			} 
			else if ( this.status > 299 && this.readyState == 4) {
				console.log(authTokenXhr);
				reject('ServerError:' + authTokenXhr.statusText);
				return;
			} 
			else authTokenXhr.onerror = function() {
				console.log(authTokenXhr);
				reject('RequestError' + authTokenXhr.responseText);
				return;
			} 
		};  


		authTokenXhr.open("GET", encodeURI("https://app.frontdesksuite.ca/torontotest/token")); 
		authTokenXhr.setRequestHeader('fd_emp_id', employeeId);
		authTokenXhr.setRequestHeader("Content-type","application/json");
		authTokenXhr.send(); 

	});
};


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
	getBadgeInfoFromApi().then((reservationDataFound)=>{
		console.log("reservationDataFound",reservationDataFound);
		window.open('https://boeltjen.github.io/vms/printbadge.html?'+createUrlSearchString(reservationDataFound,true), 'PRINT', 'height=500,width=700');
	}).catch((errorMessages)=> {
		console.log("Error",errorMessages);
		alert(errorMessages);
	});	
	
}
