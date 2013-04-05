/*global console:false */

define([
	'lib/emberjs/load',
	'lib/mapbox/mapbox',
	//'lib/d3/d3.v2.min',
	'app/model/Event',
	'app/controllers/eventsController',
	'lib/requirejs/plugins/text!app/templates/Main.handlebars'
],function(
	em,
	mapb,
	//d3v2,
	Event,
	eventsController,
	mainTemplateSource
){
	"use strict";
	
	return em.View.extend({
	
		template: em.Handlebars.compile(mainTemplateSource),
		newEvent: null,
		m: null,
		features: null,
		geocoder: null,
		currentGeoCodingQuery: null,
		
		init: function(event) {
			this._super();
			this.newEvent = Event.create();
			
			// fetch all objects to display list loop of events
			eventsController.getAll();
			
		},
		
		didInsertElement: function(){
			console.log("... trying to init");
			
			// init map and got to current pos if not done
			if(this.m==null) {
				console.log("... make map object and find current position");
				this.initMap();
				this.getMyPosition();
			
				// init date/time pickers
				$('#evDatePick').datepicker('setValue', Date());
				$('#evTimePick').timepicker({'defaultTime':'current'});
				
				this.refresh();
			}
			
			if (this.$().find(".evRow").length > 0) {
				console.log("... rows were found !");
     			this.setRolloverRows(); // my childViews are inserted
			} else {
				Ember.run.next(this, function() {
				this.didInsertElement();
				});
			}
		},
		
		afterRender: function(){
			//console.log("... finished rendering");
		},
					
		refresh: function() {
			console.log("... fetching events from controller");
			
			var curThis = this;
			
			// fetch event objects
			eventsController.api.getAllEvents(function(json) {
				var json = eventsController.sortFilterMe(json);
				//var mobj = curThis.m;
				
				// building features
				json.forEach(function(elem) {
					var evFeature = {
						"geometry": { "type": "Point", "coordinates": [elem['lng'],elem['lat']]},
						"properties": {
							"id":		elem['_id'],
							"name":		elem['name'],
							"loc": 		elem['loc'],
							"date": 	elem['date'],
							"link": 	elem['link'],
							'marker-color': '#000',
							'marker-size':	'small',
          					'marker-symbol': 'fire-station',
						}};
					//console.log("link:"+elem['link']);
					//console.log("NEW FEATURE:"+evFeature['geometry']['coordinates']);
					curThis.addPoint(evFeature);
				});
				
				console.log("... all features updated from events");	
								
				// add map layer with all points
				var markerLayerPoints = mapbox.markers.layer().features(curThis.features);
				curThis.m.addLayer(markerLayerPoints);
				
				// custom markers interaction + tooltip
				markerLayerPoints.factory(function(fo) {
					// Create a marker using the simplestyle factory (it's a DOM img elem !)
					var elmark = mapbox.markers.simplestyle_factory(fo);
					elmark.id = "mark_"+fo.properties.id;
					
					var todaysDate = new Date();
					var theDate = new Date(fo.properties.date);
					//if(theDate.setHours(0,0,0,0) == todaysDate.setHours(0,0,0,0))
					//var elmark = document.getElementById('themarker').cloneNode(true);
					//elmark.style.display = 'block';
					
					// Rollover color
					MM.addEvent(elmark, 'mouseover', function(e) {
						elmark.src = "http://a.tiles.mapbox.com/v3/marker/pin-s-fire-station+3399CC.png";
						var oId = elmark.id.split("_")[1];
						//console.log('over:'+oId);
						$('#row_'+oId).css("background","#E1EAF6");
					});
					MM.addEvent(elmark, 'mouseout', function(e) {
						elmark.src = "http://a.tiles.mapbox.com/v3/marker/pin-s-fire-station+000.png";
						var oId = elmark.id.split("_")[1];
						console.log('over:'+oId);
						$('#row_'+oId).css("background","none");
					});
					
					// Add function that centers marker on click
					MM.addEvent(elmark, 'click', function(e) {
						var zl = curThis.m.getZoom();
						console.log("current zoom="+zl);
						curThis.m.ease.location({
							lat: fo.geometry.coordinates[1],
							lon: fo.geometry.coordinates[0]+0.2785/(zl*2.6)
						}).zoom(curThis.m.zoom()).optimal();
						//curThis.m.panBy(-300, 0);
					}); 
					return elmark;
				});
				
				var interaction = mapbox.markers.interaction(markerLayerPoints);
				// Provide a function that returns html to be used in tooltip for every point
				interaction.formatter(function(feature) {
					var p = feature.properties;
					var o = '<div id="">'+p.loc+'</div>';
					return o;
				});
				console.log("... all markers set up with rollover actions");
			});
		},
		
		setRolloverRows: function() {
			var curThis = this;
			console.log("... attaching rollover table to recentering");
			// for each, attach mouse event to recenter map on geoloc
			$(".evRow").each(function(i,ob) {
				var el = $(ob);
				var evId = ob.id.split("_")[1];
				//console.log("attaching id="+evId);
				var elng = parseFloat(el.find("#evLng").html());
				var elat = parseFloat(el.find("#evLat").html());
				el.on('click',function() {
					var zl = curThis.m.getZoom();
					//console.log("... centering (z:"+zl+") to: "+evId+" = "+elat+","+elng);
					var mlng = elng + 0.2785/(zl*2.6);
					curThis.m.center({lat:elat,lon:mlng},true);				
				});
				el.mouseover(function() {	
					var mark = $('#mark_'+evId);
					mark.attr('src','http://a.tiles.mapbox.com/v3/marker/pin-s-fire-station+3399CC.png');
					mark.mouseover();
				});
				el.mouseout(function() {
					var mark = $('#mark_'+evId);
					mark.attr('src','http://a.tiles.mapbox.com/v3/marker/pin-s-fire-station+000.png');
					mark.mouseout();
				});
			});
		},
					
		initMap: function() {	
			this.m = mapbox.map('map').zoom(14).center({lat:6.240903,lon:-75.570196});
			var backLayer = mapbox.layer().id('minut.map-qgm940aa');
			this.m.addLayer(backLayer);
			var dimensions = this.m.dimensions;
			this.m.parent.className += ' map-fullscreen-map';
			document.body.className += ' map-fullscreen-view';
			this.m.dimensions = { x: this.m.parent.offsetWidth, y: this.m.parent.offsetHeight };
			this.m.draw();
			
			// define sample points
			this.features = [];
			
			console.log("... map build !");
		},
		
		addPoint: function(newFeature) {
			this.features.push(newFeature);
		},
		
		geoCodeString: function(adressString,successfunc) {
			this.geocoder = new google.maps.Geocoder();
			this.currentGeoCodingQuery = adressString;
			console.log("geocoding search launch for: " + this.currentGeoCodingQuery);
			var curWantedStr = adressString;
			this.geocoder.geocode( {'address': adressString} , function(results,status) {
				if(status == google.maps.GeocoderStatus.OK) {
					var coordFound = [results[0].geometry.location.lng(),results[0].geometry.location.lat()];
					console.log("... geocodingSuccess for: "+curWantedStr);
					console.log("... geocodingSuccess is: "+coordFound[0]+"|"+coordFound[1]);
					successfunc(curWantedStr,coordFound);
				  } else {
					console.log("Geocode was not successful for the following reason: " + status);
				  }		
			});
		},
		
		getMyPosition: function() {			
			// Create an empty markers layer, for my current position
			var markerLayerMyPos = mapbox.markers.layer();
			this.m.addLayer(markerLayerMyPos);
			var interaction = mapbox.markers.interaction(markerLayerMyPos);
			interaction.formatter(function(feature) {
				return "aquí estoy !";
			});
			
			var curThis = this;
			// fetching my current position (from browser)			
			navigator.geolocation.getCurrentPosition(
				function(position) {
					// Once we've got a position, zoom and center the map
					// on it, add ad a single feature
					console.log("... current location found!");
					var zl = curThis.m.getZoom()
					curThis.m.center({
						lat: position.coords.latitude,
						lon: position.coords.longitude + 0.2785/(zl*2.6) // translate poco poco to left
					},true);
					markerLayerMyPos.add_feature({
						geometry: {
							coordinates: [
								position.coords.longitude,
								position.coords.latitude]
							},
							properties: {
								'marker-color': '#FF9933',
								'marker-symbol': 'swimming',
								'marker-size':'medium',
							}
					});
				},
				function(err) {
					// If the user chooses not to allow their location
					console.log("you refused to show your location!");
				}
			);
		},
		
		removeEvent: function(event) {
			var eventId = event.context.get('_id');

			eventsController.api.removeEvent(eventId, function() {
				eventsController.removeObject(event.context);

			}.bind(this), function(err) {
				console.log('error', err);
			}.bind(this));
		},
		
		createVirtualEvent: function() {
			var lat = 6.235925;
			var lng = -75.57513699999998;
			var resufu = function(res) {
	  			console.log('RESULT='+res);
	  			for(var k in res) console.log('INTHERE'+k+"/"+res[k]);
	  		};
			FB.api( '/331218348435', function (response) {
				resufu(response);
			});
			


/*
			$.ajax({
				type: "GET",
				url: 'https://graph.facebook.com/search?',
	  			data: {
	  				'access_token' 	: '',
	  				'type'			: 'place',
	  				'center'		: lat+','+lng,
	  				'distance'		: 150,
	  				'limit'			: 5,
	  			},
	  			dataType: 	'json',
	  			error:		resufu,
	  			success: 	resufu,
			});
*/
/*
			FB.api('/me', function(response) {
				console.log('CODE'+response);
				for(k in response)
					console.log('INTHERE'+k+"/"+response[k]);
				console.log('Your name is ' + response.name);
			});
*/

/*
			var curThis = this;
			var eventLoc = "Wandering Paisa Hostal";
			var foundpoint = this.theMap.geoCodeString(eventLoc+", Medellin, Colombia", function(locString,foundpoint) {
				console.log("LOCATED POINT:"+foundpoint);
				
				var geocodedFoundPoint = {
					"geometry": { "type": "Point", "coordinates" : foundpoint },
					"properties": {
						"name":locString,
						"url":"nopa",
						"city":locString
					}
				};
				curThis.theMap.addPoint(geocodedFoundPoint);
				
				eventsController.api.createEvent({
					name: 	"nouveau",
					loc: 	eventLoc,
					lng:	foundpoint[0],
					lat:	foundpoint[1],
					date: 	new Date(),
					link: 	"nolinkatall"
					
				},function(data) {
					curThis.newEvent.set('_id', data.id);
					eventsController.pushObject(curThis.newEvent);
					curThis.set('newEvent', Event.create());
				}.bind(curThis), function(err) {
					console.log('error', err);
				}.bind(curThis));
			});
*/
		},
		
		createEvent: function() {
			
			var eventName = this.newEvent.get('name');
			var eventLoc = this.newEvent.get('loc');
			var eventLink = this.newEvent.get('link');
			var eventDate = this.newEvent.get('date');
			
			if (eventName === undefined || eventName === null || eventName === '') {
				em.$('#eventName').focus();
				return;
			}
			
			var tt = $("#evTimePick").val();
			var dd = $("#evDatePick input").val();
			var eventDateTime = Date.parse(tt+" "+dd);
			console.log("CREATING EVENT: "+dd+" / "+tt+" / "+eventDateTime );
			console.log("DATETIME is:"+ eventDateTime.toString('dd/mm/yyyy HH:mm:ss GMT'));
			
			var curThis = this;
			
			var foundpoint = this.geoCodeString(eventLoc+", France", function(locString,foundpoint) {
				console.log("LOCATED POINT:"+foundpoint);
				
				var geocodedFoundPoint = {
					"geometry": { "type": "Point", "coordinates" : foundpoint },
					"properties": {
						"name":locString,
						"url":"nopa",
						"city":locString
					}
				};
				curThis.addPoint(geocodedFoundPoint);
				
				eventsController.api.createEvent({
					name: 	eventName,
					loc: 	eventLoc,
					lng:	foundpoint[0],
					lat:	foundpoint[1],
					date: 	eventDateTime,
					link: 	eventLink
					
				},function(data) {
					curThis.newEvent.set('_id', data.id);
					eventsController.pushObject(curThis.newEvent);
					curThis.set('newEvent', Event.create());
					eventsController.getAll();
					//curThis.refresh();
				}.bind(curThis), function(err) {
					console.log('error', err);
				}.bind(curThis));
			});
		}
	});
});
