const rootPath = "https://boeltjen.github.io/vms";

var getBadgeInfoFromApi = function() {
	return new Promise((resolve,reject) => {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const noRegistrationErrorStr = "No Registration Data Displayed for Printing.\n\nPlease Select a Registration and Try Again.";
		
		var ticketsData = {};
		
		var addReservationDataToTicket = function(ticketId,reservationId,tempAuthToken,employeeId) {

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
						resolve(singleResObj);
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

				reservationsXhr.open("GET", encodeURI("https://counter-api.frontdesksuite.ca/api/v1/reservations/reservation-field-values?reservationId=" + reservationId)); 

				reservationsXhr.setRequestHeader('Authorization', 'Bearer ' + tempAuthToken);
				reservationsXhr.setRequestHeader('fd_emp_id', employeeId);
				reservationsXhr.send();
			});
		};



		var addQueueDataToTicket = function(ticketId,queueId,categoryId,tempAuthToken,employeeId) {

			return new Promise((resolve,reject) => {
				var organizationQueuesXhr = new XMLHttpRequest(); 
				organizationQueuesXhr.onreadystatechange = function() {

					if (this.readyState == 4 && this.status == 200) {
						var responseObj = JSON.parse(this.responseText);
						var additionalQueueData = {};
						var organizationQueues = responseObj.data;
						organizationQueues.forEach(function(queueObj) {
							if(queueObj.id == queueId) {
								ticketsData[ticketId]["queue"] = queueObj.name;						
								additionalQueueData["queue"] = queueObj.name;						
								queueObj.categories.forEach(function(categoryObj) {
									if(categoryObj.id == categoryId) {
										ticketsData[ticketId]["category"] = categoryObj.name;
										additionalQueueData["category"] = categoryObj.name;
									}
								});
							}
						});
						var bracketsCheckRegex = /\((.*?)\)/;		
						var tempQueueLocation = (additionalQueueData["queue"].match(bracketsCheckRegex) || [""]).pop();

						if((/councillor office/i).test(additionalQueueData["category"]) && tempQueueLocation) {
							additionalQueueData["category"] = tempQueueLocation;
						}

						if((/councillor/i).test(additionalQueueData["queue"])) {
							additionalQueueData["queue"] = additionalQueueData["queue"].substring(0,additionalQueueData["queue"].toLowerCase().indexOf(" - ward"));
						}
						
						resolve(additionalQueueData);
						return;						
					} 
					else if ( this.status > 299 && this.readyState == 4) {
						console.log({waitingTicketsXhr});
						reject('ServerError:' + organizationQueuesXhr.statusText);
						return;
					} 
					else organizationQueuesXhr.onerror = function() {
						console.log({waitingTicketsXhr}); 
						reject('RequestError' + organizationQueuesXhr.responseText);
						return;					
					} 
				};

				organizationQueuesXhr.open("GET", encodeURI("https://counter-api.frontdesksuite.ca/api/v1/queues/organization-queues")); 

				organizationQueuesXhr.setRequestHeader('Authorization', 'Bearer ' + tempAuthToken);
				organizationQueuesXhr.setRequestHeader('fd_emp_id', employeeId);

				organizationQueuesXhr.send();
			});
		};



		var getTicketDataByKey = function(ticketKey,tempAuthToken,employeeId) {
			var ticketsXhr = new XMLHttpRequest(); 
			ticketsXhr.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					var responseObj = JSON.parse(this.responseText); 
					var rawTick = responseObj.data;
					var resPromisesToCall = [];

					var lastOperation = rawTick.operations[rawTick.operations.length-1];
					var tickDataEle = {
						"id":rawTick.ticketId,
						"reservationTimeStr":rawTick.displayText,
						"queueCategoryId" :	lastOperation.queueCategoryId,
						"queueId" :	lastOperation.queueId,
						"reservation" : rawTick.reservation,
						"state" : rawTick.state
					};

					tickDataEle["createTime"] = (new Date(lastOperation.createdAt)).toTimeString().substr(0,5);
					tickDataEle["createDate"] = (new Date(lastOperation.createdAt)).toDateString().substr(4,6).replace(/ /g,"-").toUpperCase();

					var tempDate = new Date();
					tickDataEle["currentDateStr"] = tempDate.toDateString().substr(0,10).replace(/ /g,"-").toUpperCase();
					tickDataEle["currentShortDateStr"] = tempDate.toDateString().substr(4,6).replace(/ /g,"-").toUpperCase();
					tickDataEle["currentTimeStr"] = tempDate.toTimeString().substr(0,5);

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
						tickDataEle["reservationId"] = tickDataEle.reservation.reservationId;
						tickDataEle["reservationTime"] = (new Date(tickDataEle.reservation.reservationTime)).toTimeString().substr(0,5);
						tickDataEle["reservationDate"] = (new Date(tickDataEle.reservation.reservationTime)).toDateString().substr(4,6).replace(/ /g,"-").toUpperCase();

						resPromisesToCall.push(addReservationDataToTicket(tickDataEle.id,tickDataEle.reservationId,tempAuthToken,employeeId));
						resPromisesToCall.push(addQueueDataToTicket(tickDataEle.id,tickDataEle.queueId,tickDataEle.queueCategoryId,tempAuthToken,employeeId));
						
						ticketsData[tickDataEle.id] = tickDataEle;
					}

					Promise.all(resPromisesToCall).then((arrayOfParamObjs)=>{
						
						arrayOfParamObjs.forEach(function(paramsToAdd) {
							for (var key in paramsToAdd) tickDataEle[key] = paramsToAdd[key];
						});
						
						let ticketsDataArray = [];
						for (var n in ticketsData) ticketsDataArray.push(ticketsData[n]);
						//currently only providing the single open card ticket
						
						resolve(tickDataEle);
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
			
			ticketsXhr.open("GET", encodeURI("https://counter-api.frontdesksuite.ca/api/v1/tickets/" + ticketKey)); 
			ticketsXhr.setRequestHeader('Authorization', 'Bearer ' + tempAuthToken);
			ticketsXhr.setRequestHeader('fd_emp_id', employeeId);

			ticketsXhr.setRequestHeader("Content-type","application/json");
			ticketsXhr.send(); 
			
		};
		
		var getAuthToken = function(ticketKey, employeeId) {
			var authTokenXhr = new XMLHttpRequest(); 
			authTokenXhr.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					var responseObj = JSON.parse(this.responseText); 
					var tempAuthToken = responseObj.token;
					getTicketDataByKey(ticketKey,tempAuthToken,employeeId);
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
		};
		
		
		var tempTicketKey = "";
		var ticketCardElements = document.querySelectorAll("[class^='ticket-'].ticket");
		if(ticketCardElements.length) {
			ticketCardElements.forEach(function(ticketCard) {
				if(ticketCard.querySelectorAll(".actions").length) {
					tempTicketKey = ticketCard.className.match(/ticket-([a-zA-Z0-9-]*)/i)[1];				
				}
			});
		} else {
			var pathnameArray = window.location.pathname.split("/");
			if(pathnameArray[pathnameArray.length-2].toString().toLowerCase().trim() == "process") tempTicketKey = pathnameArray[pathnameArray.length-1];
			else tempTicketKey = false;
		}
		if(!tempTicketKey) {
			reject(noRegistrationErrorStr);
			return false;
		}
		
		var tempEmployeeId = JSON.parse(localStorage.getItem("employee")).employeeId;

		getAuthToken(tempTicketKey,tempEmployeeId);
		
	});
};


var createUrlSearchString = function(paramObj,stripWhiteAndLowerCaseParams) {
	var returnString = "";
	for (var key in paramObj) {
		if(typeof paramObj[key] === 'object' || typeof paramObj[key] === 'function') continue;
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
		window.open(rootPath + '/printbadge.html?'+createUrlSearchString(reservationDataFound,true), 'PRINT', 'height=500,width=700');
	}).catch((errorMessages)=> {
		console.log("Error",errorMessages);
		alert(errorMessages);
	});	
	
}
