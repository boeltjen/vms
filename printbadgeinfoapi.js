var getBadgeInfoFromApi = function() {
	return new Promise((resolve,reject) => {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const todayDate = new Date();
		const todayDateResFormat = todayDate.getFullYear()+"-"+(todayDate.getMonth()+1)+"-"+todayDate.getDate();		
		const currentDateStr = todayDate.toDateString().substr(0,10).replace(/ /g,"-").toUpperCase();
		const currentTimeStr = todayDate.toTimeString().substr(0,5);
		var tempAuthToken = "";
		var ticketsData = {};
		var ticketKey = "";
		var ticketCardElements = document.querySelectorAll("[class^='ticket-'].ticket");
		ticketCardElements.forEach(function(ticketCard) {
			if(ticketCard.querySelectorAll(".actions").length) {
				ticketKey = ticketCard.className.match(/ticket-([a-zA-Z0-9-]*)/i)[1];				
			}
		});
		if(!ticketKey) {
			console.log("No Open Tickets found");
		}

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
					} 
					else if ( this.status > 299 && this.readyState == 4) {
						console.log('ServerError:' + reservationsXhr.statusText);
						reject({reservationsXhr});

					} 
					else reservationsXhr.onerror = function() {
						console.log('RequestError' + reservationsXhr.responseText); 
						reject({reservationsXhr});
					} 
				};

				reservationsXhr.open("GET", encodeURI("https://counter-api.frontdesksuite.ca/api/v1/reservations/reservation-field-values?reservationId=" + ticketsData[ticketId].reservation.reservationId)); 

				reservationsXhr.setRequestHeader('Authorization', 'Bearer ' + tempAuthToken);

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
							}
						});
						resolve(true);
					} 
					else if ( this.status > 299 && this.readyState == 4) {
						console.log('ServerError:' + waitingTicketsXhr.statusText);
						reject({waitingTicketsXhr});

					} 
					else waitingTicketsXhr.onerror = function() {
						console.log('RequestError' + waitingTicketsXhr.responseText); 
						reject({waitingTicketsXhr});
					} 
				};

				waitingTicketsXhr.open("GET", encodeURI("https://counter-api.frontdesksuite.ca/api/v1/tickets/waiting-tickets")); 

				waitingTicketsXhr.setRequestHeader('Authorization', 'Bearer ' + tempAuthToken);
				waitingTicketsXhr.setRequestHeader('fd_emp_id', '8488');

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
				if (tickDataEle.reservation && (tickDataEle.state == 1)) {
					ticketsData[tickDataEle.id] = tickDataEle;
					resPromisesToCall.push(addReservationDataToTicket(tickDataEle.id));
					resPromisesToCall.push(addQueueDataToTicket(tickDataEle.id));
				}
				Promise.all(resPromisesToCall).then(()=>{
					let ticketsDataArray = [];
					for (var n in ticketsData) ticketsDataArray.push(ticketsData[n]);
					resolve(ticketsDataArray);
				}).catch(()=> {
					console.log("promise error",this);
					reject(false);
				});	
			} 
			else if ( this.status > 299 && this.readyState == 4) {
				console.log('ServerError:' + ticketsXhr.statusText);
				reject(false);
			} 
			else ticketsXhr.onerror = function() {
				console.log('RequestError' + ticketsXhr.responseText);
				reject(false);
			} 
		};


		var authTokenXhr = new XMLHttpRequest(); 
		authTokenXhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var responseObj = JSON.parse(this.responseText); 
				tempAuthToken = responseObj.token;
				ticketsXhr.open("GET", encodeURI("https://counter-api.frontdesksuite.ca/api/v1/tickets/" + ticketKey)); 
				ticketsXhr.setRequestHeader('Authorization', 'Bearer ' + tempAuthToken);
				ticketsXhr.setRequestHeader("Content-type","application/json");
				ticketsXhr.send(); 
			} 
			else if ( this.status > 299 && this.readyState == 4) {
				alert('ServerError:' + authTokenXhr.statusText); 
			} 
			else authTokenXhr.onerror = function() {
				alert('RequestError' + authTokenXhr.responseText); 
			} 
		};  


		authTokenXhr.open("GET", encodeURI("https://app.frontdesksuite.ca/torontotest/token")); 
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
// 		window.open('https://boeltjen.github.io/vms/printbadge.html?'+createUrlSearchString(reservationDataFound,true), 'PRINT', 'height=500,width=700');
	}).catch(()=> {
		console.log("promise error",this);
		alert("No Registration Data Displayed for Printing.\n\nPlease Select a Registration and Try Again.");
	});	
	
}
