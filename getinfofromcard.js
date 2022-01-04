	var reservationFieldDivParent = document.getElementsByClassName('reservation-field-values')[0];
	if(reservationFieldDivParent == undefined) {alert("No Registration Data Displayed for Printing.\n\nPlease Select a Registration and Try Again.");}
	else {
		var reservationFieldDivs = reservationFieldDivParent.querySelectorAll(".item");
		var reservationData = {};
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


		var getBadgePrintWindowHtml = function(badgeInfoParams) {
			
			return '
				<style>
				
					.reservationFields {
						font-size: 16px;
						height: 155px;
						font-family: sans-serif;
						line-height: 1.5;
						padding: 5px 10px 5px 10px;
					}

					#badgeContainer {	
						width: 295px;
						position: relative;
						height: 215px;
					    border: thin dashed;
					}
					
					.torontoLogo {
						height:40px;
						float: right;
						padding: 5px 10px;
					}

					.largeContentDiv {
						height: 50px;
					}
					
					
					.visitorLabel {
						font-family: sans-serif;
						font-weight: bold;
					    font-size: 25px;
					}
					
					#print-dialog {
						width: 380px;
						margin: auto;
					}
					
					#full-badge {				
						position: relative;
						width: 380px;
						border: thin dashed;
						padding: 5px;
					}
					
					.fold-under {
						font-weight: 600;
						font-family: sans-serif;
						transform: rotate(
						90deg);
						float: right;
						position: absolute;
						left: 300px;
						top: 75px;
						text-align: center;
						font-size: 20px;
						border: thin dashed;
						padding: 0px 10px;				
					}
					
					.visitor-name {
						font-size: larger;
						font-weight: bold;
					}
					.printButtonDiv {
						text-align: center;
						margin: 10px 0px;
					}
					
					.printButtonDiv button {
						padding: 10px 32px;
						font-size: 18px;
						font-weight: bold;
					}
					
					@media print {
						.printButtonDiv {
							display: none;
						}
						.printButtonDiv {
							align: inherit;
						}
						
						.fold-under {
							display:none;
						}
						
						#badgeContainer {	
							border: none;
						}
						
						#full-badge {
							border: none;
						}

						
					    body, html, {
							margin: 0pt !important;
							padding: 0pt !important;
						}
						@page {
						   margin: 0pt !important;
						   padding: 0pt !important;
						   size: 4in 2.4in landscape;
						}
						
					}
					
				</style>
				
				<div id="print-dialog">
					<div id="full-badge">
						<div class="fold-under">
							FOLD<br>UNDER<br>V &nbsp; &nbsp; V
						</div>
						<div id="badgeContainer">
							<div class="reservationFields">
								<div class="visitorLabel">VISITOR-'+badgeInfoParams["currentShortDateStr"]+'-'+badgeInfoParams["currentTimeStr"]+'</div>
								<div class="visitor-name">'+badgeInfoParams["Visitor Full Name"]+' ('+badgeInfoParams["Visitor Type"]+')</div>
								<strong>Visiting: </strong>'+badgeInfoParams["Queue"]+'
								<br/><strong>Location: </strong>'+badgeInfoParams["Category"]+'
							</div>
							<div class="largeContentDiv">
								<img class="torontoLogo" src="https://images.frontdesksuite.ca/torontotest/Icons/torontologo.647x200.jpg">
							</div>	
						</div>
					</div>
					<div class="printButtonDiv">
						<button onclick="window.print(); window.close();">Print</button>
						&nbsp;&nbsp;
						<button onclick="window.close();">Close</button>
					</div>
				</div>

			';
		};

		
		var el = getBadgePrintWindowHtml(reservationData).replace(/\t/g,"");

		var badgePrintWindow = window.open('', 'PRINT', 'height=500,width=700');
		badgePrintWindow.document.head.innerHTML = "<title>Print Badge</title>";
		badgePrintWindow.document.body.innerHTML = el;
	}
