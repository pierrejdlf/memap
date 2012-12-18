define([
	'app/model/Event',
	'app/controllers/BaseController'
],function(
	Event,
	BaseController
){
	"use strict";
	
	return BaseController.create({

		resourceType: Event,
		showPast: false,

		getAll: function(onDone, onFail) {
			this.clearAll();
			this.api.getAllEvents(function(json) {
				var sorted = this.sortFilterMe(json);
				this.loadAll(sorted);
				if (onDone) {
					onDone();
				}
			}.bind(this), function(err) {
				if (onFail) {
					onFail(err);
				}
			}.bind(this));
		},
		
		sortFilterMe: function(json) {
			// sort based on date
			//console.log("SORTING");
			var sortedContent = json.sort(function(a,b) {
				var date1 = a.date;
				var date2 = b.date;
				if (date1 > date2) return 1;
				if (date1 < date2) return -1;
				return 0;
			});
/*
			sortedContent.forEach(function(u) {
				console.log("e="+u.date);
			});
*/
			var todaysDate = new Date();
			if(this.showPast) return sortedContent;
			else return sortedContent.filter(function(e) {
				var theDate = new Date(e.date);
				return (theDate.setHours(0,0,0,0) >= todaysDate.setHours(0,0,0,0));
			});
		}
	});
});
