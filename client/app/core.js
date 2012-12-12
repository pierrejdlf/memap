define([
	'lib/emberjs/load',
	"app/views/MainView",
	"app/controllers/eventsController"
],function(
	em,
	MainView,
	eventsController
){
	"use strict";

	em.App = em.Application.create({
		mainView: MainView.create({}),
		eventsController: eventsController
	});

	// custom formatters to render in template
	// cd formats @ http://code.google.com/p/datejs/wiki/FormatSpecifiers
	em.Handlebars.registerHelper('formatDate', function(path, options) {
		var theDate = new Date(this.get(path));
		var todaysDate = new Date();
		if(theDate.setHours(0,0,0,0) == todaysDate.setHours(0,0,0,0))
			return "hoy";
		return theDate.toString("ddd d MMM");
	});
	em.Handlebars.registerHelper('formatTime', function(path, options) {
		var theDate = new Date(this.get(path));
		return theDate.toString("h:mm tt");
	});
	em.Handlebars.registerHelper('formatLink', function(path, options) {
		var rawLink = this.get(path);
		return new em.Handlebars.SafeString('<a target="_blank" href="'+rawLink+'"><span class="add-on"><i class="icon-share-alt"></i></span></a>');
	});	
	
	em.App.mainView.appendTo('body');

	return em.App;
});
