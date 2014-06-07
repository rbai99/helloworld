var TAG = 'dao-pool';

var mongoose = require('mongoose');

var log = require('../../util/log.js');
var logger = log.logger;
var connection;

var createMongoosePool = function(next) {
    mongoose.connect('mongodb://localhost/car_test_0');

    connection = mongoose.createConnection('mongodb://localhost/car_test_0');
    connection.once('open', function () {
        logger.info(TAG + ' db opened');
        exports.connection = connection;

        next(null);
    });
}

exports.createMongoosePool = createMongoosePool;
