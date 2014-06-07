var async = require('async');

var CarDao = require('../../lib/dao/carDao');
var Car = CarDao.Car;

var CarsData = [
    {
        vendor: '大众',
        family: 'polo',
        displacement: '1.4',
        productiveYear: '2011',
        stageList: [
            {
                name: 'Stage of before buying car'
            }
        ]
    },
    {
        vendor: '大众',
        family: 'polo',
        displacement: '1.6',
        productiveYear: '2011',
        stageList: [
            {
                name: 'Stage of before buying car'
            }
        ]
    },
    {
        vendor: '大众',
        family: '高尔夫',
        displacement: '1.4TSI',
        productiveYear: '2011',
        stageList: [
            {
                name: 'Stage of before buying car'
            }
        ]
    }
];


exports.test = function() {

    async.each(CarsData, function(item, next) {
        //console.log(item);
        Car.findOne({
            vendor: item.vendor,
            family: item.family,
            displacement: item.displacement,
            productiveYear: item.productiveYear
        }, function(err, car) {
            if (null == err) {
                if (null == car) {
                    Car.create(item, next);
                } else {
                    console.log(item, " has existed");
                }
            } else {
                console.log('insert car data met err ', err);
            }
        });
    }, function(err) {
        //console.log(err);
    });
}