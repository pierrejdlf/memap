/*global console:false */

define([
	'lib/emberjs/load',
	'lib/mapbox/mapbox',
	//'lib/leaflet/leaflet',
	//'lib/d3/d3.v2',
	'app/model/Map',
	'app/model/Event',
	'app/controllers/eventsController',
	'app/controllers/mapController',
	'lib/requirejs/plugins/text!app/templates/Main.handlebars'
],function(
	em,
	mapb,
	//leaflet,
	//d3v2,
	Map,
	Event,
	eventsController,
	map,
	mainTemplateSource
){
	"use strict";
	
	return em.View.extend({
		template: em.Handlebars.compile(mainTemplateSource),
		newEvent: null,
		theMap: null,
		showPast: eventsController.showPast,
		
		init: function(event) {
			this._super();
			this.theMap = Map.create();
			this.newEvent = Event.create();
		},
		
		didInsertElement: function(){
			console.log("DOM READY, INITING THINGS");
			
			// init date/time pickers
			$('#evDatePick').datepicker('setValue', Date());
			$('#evTimePick').timepicker({'defaultTime':'current'});
			
			this.refresh();
			
			//this.theMap.geoCodeString('Casa tres patios, Medellin, Colombia');
			//this.theMap.geoCodeString('Terminal transporte, medellin');
		},
		
		initMap: function(){
			// adjust map size
			var H = $(window).height()*80/100;
			var W = $(window).width()/3;
			console.log('size'+H+" / "+W);
			$("#cellmap").height(H);
			$("#cellmap").width(W);
			$("#mapcontainer").height(H);
			$("#mapcontainer").width(W);
			$("#map").height(H);
			$("#map").width(W);
			
			// build map and move to current pos
			this.theMap.initMe();
			this.theMap.getMyPosition();
		},
		
/*
		fireMouse: function(elem,typ) {
			if( document.createEvent ) {
				var evObj = document.createEvent('MouseEvents');
				evObj.initEvent( 'mouse'+typ, true, false );
				elem.dispatchEvent(evObj);
			} else if( document.createEventObject ) {
				elem.fireEvent('onmouse'+typ);
			}
		},
*/
					
		refresh: function() {
			console.log("... Refreshing, showpast="+this.showPast);
			
			// fetch all objects to display list loop of events
			eventsController.getAll();
			
			var curThis = this;
			
			// we also fetch [lng,lat] to create points in the map
			eventsController.api.getAllEvents(function(json) {
				var json = eventsController.sortFilterMe(json);
				// init mapbox object
				curThis.initMap();
				
				var mobj = curThis.theMap;
				
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
					console.log("link:"+elem['link']);
					//console.log("NEW FEATURE:"+evFeature['geometry']['coordinates']);
					mobj.addPoint(evFeature);
					
					console.log("... Attaching rollover table to recentering");
					// for each, attach mouse event to recenter map on geoloc
					var therow = $('#row_'+elem['_id']);
					therow.mouseover(function() {
						console.log("centering to:"+ elem['lat']+"/"+elem['lng']);
						var zl = mobj.m.getZoom()
						mobj.m.center({lat:elem['lat'], lon:elem['lng'] + 0.2785/(zl*2.6)},true);
						$('#mark_'+elem['_id']).attr('src','http://a.tiles.mapbox.com/v3/marker/pin-s-fire-station+3399CC.png');
						//curThis.fireMouse($('#mark_'+elem['_id']),'over');
					});
					therow.mouseout(function() {
						$('#mark_'+elem['_id']).attr('src','http://a.tiles.mapbox.com/v3/marker/pin-s-fire-station+000.png');
						//curThis.fireMouse($('#mark_'+elem['_id']),'out');
					});
				});
				
			
				console.log("... All events received");	
								
				// add map layer with all points
				var markerLayerPoints = mapbox.markers.layer().features(mobj.features);
				mobj.m.addLayer(markerLayerPoints);
				
				// custom markers interaction + tooltip
				markerLayerPoints.factory( function(fo) {
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
						console.log('over:'+oId);
						$('#row_'+oId).css("background","#f5f5f5");
					});
					MM.addEvent(elmark, 'mouseout', function(e) {
						elmark.src = "http://a.tiles.mapbox.com/v3/marker/pin-s-fire-station+000.png";
						var oId = elmark.id.split("_")[1];
						console.log('over:'+oId);
						$('#row_'+oId).css("background","none");
					});
					
					// Add function that centers marker on click
					MM.addEvent(elmark, 'click', function(e) {
						var zl = mobj.m.getZoom();
						console.log("current zoom="+zl);
						mobj.m.ease.location({
							lat: fo.geometry.coordinates[1],
							lon: fo.geometry.coordinates[0]+0.2785/(zl*2.6)
						}).zoom(mobj.m.zoom()).optimal();
						//mobj.m.panBy(-300, 0);
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
					
			});
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
					this.refresh();
				}.bind(curThis), function(err) {
					console.log('error', err);
				}.bind(curThis));
			});
		}
	});
});
