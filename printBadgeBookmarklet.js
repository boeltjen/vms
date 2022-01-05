javascript: (function() {
	/* uncomment per version to use */
	/* const printBadgeId = "printBadgeInfo" + "FromCard"; */
	const printBadgeId = "printBadgeInfo" + "FromApi";
	
	if(!(document.getElementById(printBadgeId+"Script"))){
		var printBadgeScript=document.createElement("script");
		printBadgeScript.id = printBadgeId+"Script";
		file_var = "https://boeltjen.github.io/vms/"+printBadgeId.toLowerCase()+".js?nocache="+(new Date()).getTime();
		printBadgeScript.src=file_var;
		printBadgeScript.type="text/javascript";
		document.head.appendChild(printBadgeScript);
	}
	
	var waitAndPrintBadgeInfo = function() {
		if(typeof printbadgeinfo === "undefined") {
			console.log("printbadgeinfo() not found.  waiting...");
			setTimeout(waitAndPrintBadgeInfo,100);
		} else {
			printbadgeinfo();
		}
	};
	
	waitAndPrintBadgeInfo();
 
}());
