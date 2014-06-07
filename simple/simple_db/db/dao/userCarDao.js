/**
 * Created by xfxu on 14-5-31.
 */
var Collection = require('./collections');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserCarMaintenance = new Schema({
    date: {type: Date},
    mileage: {type: Number},
    price: {type: Number}
    // TODO:
});

var UserCarSchema = new Schema({
    car: {type: Schema.Types.ObjectId, ref: Collection.carsCollection},
    mileage: {type: Number},
    maintenanceList: [UserCarMaintenance],
    questionList: [{type: Schema.Types.ObjectId, ref: Collection.questionsCollection}]
    // TODO:
});

var UserCar = mongoose.model(Collection.usersCarsCollection, UserCarSchema);


exports.UserCar = UserCar;