/**
 * Created by xfxu on 14-5-31.
 */
var Collection = require('./collections');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CarTypeStageContentSchema = new Schema({
    // Stage content before buying the car
    name: {type: String}

    // Stage content of new car

    // Stage content of maintenace in the 4S

    // Stage content of out of length of warranty

    // Stage content of old car
});

var CarSchema = new Schema({
    vendor: {type: String},
    family: {type: String},
    displacement: {type: String},
    productiveYear: {type: String},
    stageList: [CarTypeStageContentSchema]

    // TODO:
});

var Car = mongoose.model(Collection.carsCollection, CarSchema);


exports.Car= Car;