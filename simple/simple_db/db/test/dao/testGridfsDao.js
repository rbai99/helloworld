var async = require('async');

var GridFsDao = require('../../lib/dao/gridfsDao');
var FsFile = GridFsDao.FsFile;

var fileData = [
    {
        inName: '/home/xfxu/1.txt',
        name: '1.txt'
    },
    {
        inName: '/home/xfxu/kms.txt',
        name: 'kms.txt'
    }
];


exports.test = function() {

    async.each(fileData, function(item, next) {
        console.log(item);
        GridFsDao.writeToGfs(item.inName, item.name, next)
    }, function(err) {
        //console.log(err);
    });

    // Read
    GridFsDao.readFromGfs('/home/xfxu/a_1.txt', '1.txt', function(err) {
        console.log(err);
    })
}