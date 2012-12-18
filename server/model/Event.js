define([
    'mongoose'
],function(
    mongoose
){
	"use strict";
	
    var Schema = mongoose.Schema;

    var Event = new Schema({
        name    : String,
        loc 	: String,
        lng		: Number,
        lat		: Number,
        date	: Date,
        link	: String,
    });

    return mongoose.model('Event', Event);
});
