/**
 * Created by xfxu on 14-5-31.
 */
var async = require('async');

var UserCarDao = require('../../lib/dao/userCarDao');
var UserCar = UserCarDao.UserCar;

var CarDao = require('../../lib/dao/carDao');
var Car = CarDao.Car;


var UserCarData = [
    {
        vendor: '大众',
        family: 'polo',
        displacement: '1.4',
        productiveYear: '2011',

        mileage: 11000,

        maintenanceList: [
            {
                year: '2012',
                mon: '05',
                day: '02',
                mileage: 5600,
                price: 0
            },
            {
                year: '2014',
                mon: '01',
                day: '02',
                mileage: 10200,
                price: 900
            }
        ]

    },
];


exports.test = function() {

    async.each(UserCarData, function(item, next) {
        //console.log(item);

        // find the car
        Car.findOne({
            vendor: item.vendor,
            family: item.family,
            displacement: item.displacement,
            productiveYear: item.productiveYear
        }, function(err, carRes) {
            if (null == err) {
                if (null != carRes) {
                    var userCar = new UserCar();
                    userCar.car = carRes._id;
                    userCar.mileage = item.mileage;

                    var maintenanceList = [];
                    for (var i = 0; i < item.maintenanceList.length; i++) {
                        maintenanceList.push({
                            date: new Date(item.maintenanceList[i].year, item.maintenanceList[i].mon,
                                item.maintenanceList[i].day),
                            mileage: item.maintenanceList[i].mileage,
                            price: item.maintenanceList[i].price
                        })
                    }


                    //console.log(maintenanceList);

                    userCar.maintenanceList = maintenanceList;

                    //console.log(userCar);

                    userCar.save(function(err) {

                    });
                }
            } else {
                console.log('testUserCar find car err ' + err);
            }
        });
    }, function(err) {
        //console.log(err);
    });
}