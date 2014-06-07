var async = require('async');

var UserDao = require('../../lib/dao/userDao');
var User = UserDao.User;

var GroupDao = require('../../lib/dao/groupDao');
var UserCarDao = require('../../lib/dao/userCarDao');

var UserData = [
    {
        name: '100',
        phone: '100',
        password: '1',
        registerDate: '2014-05-30',
        lastLoginDate: '2014-05-30',
        groups: ['538879dcf44dda8e21cdff3b'],
        friends: [],
        carList: ['5389449824118bd042982e27']
    }
];


exports.test = function() {
    async.each(UserData, function(item, next) {
        console.log(item);
        User.findOne({
            phone: item.phone
        }, function(err, user) {
            if (null == err) {
                if (null == user) {
                    item.registerDate = new Date().toString();
                    User.create(item, next);
                } else {
                    console.log(item, " has existed");
                }
            } else {
                console.log('insert user data met err ', err);
            }
        });
    }, function(err) {
        //console.log(err);

        User.findOne({
            phone: '100'
        })
        .populate('groups')
        .populate('carList')
        .exec(function(err, res) {
            console.log('----',err, res);
                console.log(res.groups[0].name);
        })
    });
}