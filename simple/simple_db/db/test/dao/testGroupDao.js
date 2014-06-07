var async = require('async');

var GroupDao = require('../../lib/dao/groupDao');
var Group = GroupDao.Group;

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


exports.test = function() {

    async.each(groups, function(item, next) {
        console.log(item);
        Group.findOne(item, function(err, group) {
            if (null == err) {
                if (null == group) {
                    Group.create(item, next);
                } else {
                    console.log(item, " has existed");
                }
            } else {
                console.log('insert group data met err ', err);
            }
        });
    }, function(err) {
        //console.log(err);
    });
}