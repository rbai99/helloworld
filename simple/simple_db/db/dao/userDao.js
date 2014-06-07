/**
 * Created by xfxu on 14-5-29.
 */
var Collection = require('./collections');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: {type: String},
    phone: {type: String},
    salt: {type: String},
    hash: {type: String},	
//    password: {type: String},
    registerDate: {type: Date, default: Date.now},
    lastLoginDate: {type: Date},
    groups: [{type: Schema.Types.ObjectId, ref: Collection.groupsCollection}],
    friends: [{type: Schema.Types.ObjectId, ref: Collection.usersCollection}],
    carList: [{type: Schema.Types.ObjectId, ref: Collection.usersCarsCollection}],
    device_token: {type: String}
    // TODO:
});

var User = mongoose.model(Collection.usersCollection, UserSchema);
exports.User= User;
exports.UserSchema = UserSchema;
