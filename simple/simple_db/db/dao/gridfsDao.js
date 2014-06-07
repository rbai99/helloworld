/**
 * Created by xfxu on 14-5-30.
 */

var TAG = 'gridfsDao';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Crypto = require('crypto');
var uuid = require('node-uuid');
var Collection = require('./collections');
var DaoPool = require('./mongoose/dao-pool');
var Grid = require('gridfs-stream');
var fs = require('fs');
var log = require('../util/log.js');
var logger = log.logger;

Grid.mongo = mongoose.mongo;

var FsFilesSchema = new Schema({
    id: {type: String},
    type: {type: String},
    sub_type: {type: String}
});

var FsFiles = mongoose.model(Collection.fsFilesCollection, FsFilesSchema);

// gridfs stream
//console.log(DaoPool.connection);
var gfs = Grid(DaoPool.connection.db, Grid.mongo);
console.log("gfs create done");

exports.save = function(chunk, type, sub_type, callback) {
//    console.log("gridFS.save: data len %d", chunk.length);
    var file_id = uuid();
    var writestream = gfs.createWriteStream({filename: file_id});

    function do_save(){
        writestream.on('close', function (err) {
            var new_file_query = {id: file_id, type: type, sub_type: sub_type};
            console.log("create new fs entry:" + JSON.stringify( new_file_query));
            var new_file = new FsFiles(new_file_query).save(function (err, file) {
                callback(file);
            });
        });

        writestream.write(chunk, 'utf-8', function (err) {
            console.log("file write err!");
        });
        writestream.end();
    }

    do_save();
};

exports.load = function(id, callback) {
    FsFiles.findById(id, function(err, file){
        if (file){
            var readstream = gfs.createReadStream({filename: file.id});

            readstream.on('error', function (err) {
                console.log("load file error");
                callback(null);
            });

            readstream.on('data',function(data){
                console.log("got data %d", data.length);
                file.chunk = data;
                callback(file);
            });

            readstream.on('end',function(){
                console.log('readStream end');
            });

        }else {
            callback(null);
        }
    })
};

exports.load_stream = function(id, callback) {
    FsFiles.findById(id, function(err, file){
        if (file){
            var readstream = gfs.createReadStream({filename: file.id});
            callback(readstream);
        }else {
            callback(null);
        }
    })
};