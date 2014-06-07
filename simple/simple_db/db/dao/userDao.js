/**
 * Created by xfxu on 14-5-29.
 */
var Collection = require('./collections');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: {type: String},
    salt: {type: String},
    hash: {type: String},	
    registerDate: {type: Date, default: Date.now},
    lastLoginDate: {type: Date},
    groups: [{type: Schema.Types.ObjectId, ref: Collection.groupsCollection}],
    friends: [{type: Schema.Types.ObjectId, ref: Collection.usersCollection}],
    carList: [{type: Schema.Types.ObjectId, ref: Collection.usersCarsCollection}],
    deviceList: [{type: Schema.Types.ObjectId, ref: Collection.devicesCollection}]
});

var DevicesSchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: Collection.usersCollection},
    deviceType: {type: String, default:'android' },
    phoneNum: {type: String},
    deviceToken: {type: String}
});

var User = mongoose.model(Collection.usersCollection, UserSchema);
var Device = mongoose.model(Collection.devicesCollection, DevicesSchema);
exports.User= User;
exports.Device= Device;
exports.UserSchema = UserSchema;
exports.DevicesSchema = DevicesSchema;
