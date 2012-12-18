/*global console:false */

define([
	'server/model/Event'
],function(
	Event
){
	"use strict";
	
	return {
		remove: function(req, res) {
			Event.findById(req.params.id, function (err, event) {
				if (err) {
					res.json(500,{
						error: err
					});
					console.log('Failed to get event id ' + req.params.id + ', ' + err);
				} else {
					if (event === null) {
						res.send(404,'');
						console.log('Event ' + req.params.id + ' not found');
					} else {
						event.remove(function (err) {
							if (err) {
								res.json(500,{
									error: err
								});
								console.log('Failed to remove event id ' + req.params.id + ', ' + err);
							} else {
								res.json(200,'');
								console.log('Deleted event ' + JSON.stringify(event));
							}
						});
					}
				}
			});
		},

		getAll: function(req, res) {
			Event.find({}, function (err, events) {
				if (err) {
					res.json(500,{
						error: err
					});
					console.log('Failed to get events, ' + err);
				} else {
					res.json(200, events);
					console.log('Found events ' + JSON.stringify(events));
				}
			});
		},

		create: function(req, res) {
			var event = new Event({
				name: 	req.body.name,
				loc:	req.body.loc,
				lng:	req.body.lng,
				lat:	req.body.lat,
				date:	req.body.date,
				link:	req.body.link,
			});
			event.save(function (err) {
				if (err) {
					res.json(500,{
						error: err
					});
					console.log('Failed to create event ' + JSON.stringify(req.body) + ', ' + err);
				} else {
					res.json(200,{
						id : event.id
					});
					console.log('Created event ' + JSON.stringify(req.body));
				}
			});
		}
	};
});
