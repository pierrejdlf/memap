/*global console:false */

define([
	'lib/emberjs/load'
],function(
	em
){
	"use strict";
	
	return em.Object.extend({

		baseUrl: '/api',

		getAllEvents: function(onDone, onFail) {
			this._get('/events', onDone, onFail);
		},

		removeEvent: function(eventId, onDone, onFail) {
			this._delete('/events/'+eventId, null, onDone, onFail);
		},

		createEvent: function(event, onDone, onFail) {
			this._post('/events', event, onDone, onFail);
		},

		_ajax: function(type, resourceUrl, data, onDone, onFail, onAlways) {
			console.log('_'+type+'('+this.baseUrl + resourceUrl+')');
			return em.$.ajax({
				url: this.baseUrl + resourceUrl,
				dataType: 'json',
				data: data,
				type: type
			}).done(function(json) {
				if (onDone) {
					onDone(json);
				}
			}).fail(function(error) {
				if (onFail) {
					onFail(error);
				}
			}).always(function() {
				if (onAlways) {
					onAlways();
				}
			});
		},

		_get: function(resourceUrl, onDone, onFail, onAlways) {
			this._ajax('GET', resourceUrl, null, onDone, onFail, onAlways);
		},

		_post: function(resourceUrl, data, onDone, onFail, onAlways) {
			this._ajax('POST', resourceUrl, data, onDone, onFail, onAlways);
		},

		_put: function(resourceUrl, data, onDone, onFail, onAlways) {
			this._ajax('PUT', resourceUrl, data, onDone, onFail, onAlways);
		},

		_delete: function(resourceUrl, data, onDone, onFail, onAlways) {
			this._ajax('DELETE', resourceUrl, data, onDone, onFail, onAlways);
		}
	});
});
