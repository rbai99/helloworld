var mongoose = require('mongoose');
var async =require('async');
var Schema = mongoose.Schema;
var Collection = require('./collections');

var GroupSchema = new Schema({
    name: {type: String}
});

var Group = mongoose.model(Collection.groupsCollection, GroupSchema);

exports.Group= Group;

var groups = [
    {
        name: 'user'
    },
    {
        name: 'admin'
    },
    {
        name: 'analyzer'
    }
];

exports.Check = function(callback) {
    var count_func = function() {
        Group.count({}, function (err, count) {
            if (count == 0) {
                console.log("create group!");
                for(i = 0; i < groups.length; i++) {
                    Group.create(groups[i]);
                }
                callback();
            }else {
                Group.find({}, function(err, all_group){
                    for(i = 0; i < all_group.length; i++) {
                        console.log("group[%d]: %s", i, JSON.stringify(all_group[i]));
                    }
                    callback();
                });
            }
        });
    };

    count_func();
}