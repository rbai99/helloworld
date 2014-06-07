var mongoose = require('mongoose'), 
	Schema = mongoose.Schema;



mongoose.connect('mongodb://localhost/test');
//var conn = mongoose.createConnection('mongodb://localhost/car_test_0');
//conn.once('open', function () {
//    console.log('open' + conn);
//});
/*
var TestSchema = new Schema({

   user_id        : {type : Number, index : true}

  ,username       : {type : String}

});


var model_name = coll_name = 'taobao';

mongoose.model(model_name, TestSchema, coll_name);


var TAOBAO  = mongoose.model(model_name, coll_name);

var taobao  = new TAOBAO();

taobao.user_id  = 1;

taobao.username = 'xuanhou';

taobao.save(function(err) {

  if (err) {

    console.log('save failed');

  }

  console.log('save success');

});
*/

var GroupSchema = new Schema({
    name: {type: String}
});

var FriendSchema = new Schema({
    name: {type: String},
    phone: {type: String},
    groups: [GroupSchema]
});

var UserSchema = new Schema({
    name: {type: String},
    phone: {type: String},
    password: {type: String},
    groups: [GroupSchema],
    friends: [FriendSchema]
});

var QASchema = new Schema({
    message: {type: String},
    questioners: {type: Schema.Types.ObjectId, ref: 'users'},
    file: {type: Schema.Types.ObjectId, ref: 'fs.files'}
});

var Users = mongoose.model('users', UserSchema);
var QAs = mongoose.model('qas', QASchema);

// fs.files
var FsFilesSchema = new Schema({
    filename: {type: String},
    chunkSize: {type: Number},
    uploadDate: {type: Date},
    md5: {type: String},
    length: {type: Number}
});
var FsFiles = mongoose.model('fs.files', FsFilesSchema);

/*

QAs.findOne({message: 'who are you 1?'})
    .exec(function(err, qa) {
        FsFiles.findOne({filename: "my_file.txt"}, function(err, res) {
            console.log(err, res);
            qa.file = res._id;
            qa.save(function(err) {

            });
        });
    });
 */
/*
QAs.findOne({message: 'who are you 1?'})
    .populate('file')
    .exec(function(err, res) {
        console.log(err, res);
        console.log(res.file.filename)
    })
;
*/
// QA
/*
Users.findOne({name: 'xfxu3'}, function(err, res) {
    console.log(err, res);

    var qa = new QAs({
        message: 'who are you 1?',
        questioners: res._id
    });

    qa.save(function(err) {
        console.log(err);
    });
});
*/
/*
Users.findOne({name: 'xfxu3'}, function(err, res) {
    console.log(err, res);

    QAs.find({questioners: res._id}, function(err, res) {
        console.log(err, res);
    });
});
*/
/*
QAs.findOne({message: 'who are you 1?'})
    .populate('questioners')
    .exec(function(err, res) {
        console.log(err, res);
        console.log(res.questioners.name)
    })
;
*/

var u = new Users({
        name: 'xfxu3',
        phone: '153',
        password: '123456',
        groups: [
            {
                name: 'user'
            }
        ],
        friends: [
            {
                name: 'friend0',
                phone: '0',
                groups: [
                    {
                        name: 'user'
                    }
                ]
            },
            {
                name: 'friend1',
                phone: '1',
                groups: [
                    {
                        name: 'user'
                    }
                ]
            },
            {
                name: 'friend2',
                phone: '2',
                groups: [
                    {
                        name: 'user'
                    }
                ]
            },
            {
                name: 'friend3',
                phone: '3',
                groups: [
                    {
                        name: 'user'
                    }
                ]
            }
        ]
    });


u.save(function(err) {

  if (err) {

    console.log('save failed');

  }

  console.log('save success');

});




/*
Users.findOne({name: 'xfxu1'}, function(error, result) {
    console.log('```', result);
})
*/
// aggregate
//http://www.w3cschool.cc/mongodb/mongodb-aggregate.html
/*
Users.aggregate(
    {
        $project: {
            friends: 1,
            name: 1,
            phone: 1
        }
    },
    {
        $match: {
            name: 'xfxu1'
        }
    },
    {
        $unwind: '$friends'
    },
    {
        $match: {
            'friends.name': 'friend2'
        }
    },
    {
        $group: {
            _id: null,
            name: {
                $first: '$name'
            },
            phone: {
                $first: '$phone'
            },
            friends: {
                $push: '$friends'
            }
        }
    },
    function(error, reply) {
        console.log(reply[0].friends[0]);
    }
);
*/

/*
Users.aggregate(
    {
        $project: {
            friends: 1,
            name: 1,
            phone: 1
        }
    },
    {
        $match: {
            name: 'xfxu1'
        }
    },
    {
        $unwind: '$friends'
    },
    {
        $match: {
            'friends.name': 'friend2'
        }
    },
    {
        $unwind: '$friends.groups'
    },
    {
        $match: {
            'friends.groups.name': 'admin1'
        }
    },
    {
        $group: {
            _id: null,
            groups: {
                $push: '$friends.groups'
            }
        }
    },
    function(error, reply) {
        console.log(reply[0]);
    }
);
*/
/*
Users.aggregate(
    {
        $project: {
            friends: 1,
            name: 1
        }
    },
    {
        $unwind: '$friends'
    },
    {
        $match: {
            'friends.name': 'friend2'
        }
    },
    {
        $group: {
            _id: {friends: "$friends"}
        }
    },
    function(error, reply) {
        console.log('----', error, reply);
    }
);
*/


// update
/*
Users.update({
        name: 'xfxu2',
        'friends.name': 'friend2'
    },
    {
        $set: {
            'friends.$.phone': '159'
        }
    },
    {
        multi: true
    },
    function(err, res) {
        console.log(err);
    }
);
*/

/*
Users.update({
        name: 'xfxu1',
        'friends.name': 'friend2'
    },
    {
        $set: {
            'friends.$.groups': [{name: 'admin1'}, {name: 'admin2'}]
            }
    },
    {
        multi: true
    },
    function(err, res) {
        console.log(err);
    }
);
*/
/*
Users.update({
        name: 'xfxu1',
        'friends.name': 'friend2'
    },
    {
        $unset: {
            'friends.$.groups': [{name: 'admin1'}]
        }
    },
    {
        multi: true
    },
    function(err, res) {
        console.log(err);
    }
);
*/

/*
Users.find({
    name: 'xfxu2',
    'friends.name': 'friend2'
}, function(err, res) {
    console.log(err, res);
});
*/
// push
/*
Users.update({
        name: 'xfxu2'
    },
    {
        $push: {
            friends: {
                name: 'friend4',
                phone: '4',
                groups: [
                    {
                        name: 'user'
                    }
                ]
            }
        }
    },
    function(err, res) {
        console.log(err);
    }
);
*/
/*
Users.update({
        name: 'xfxu1',
        'friends.name': 'friend2'
    },
    {
        $push: {
            'friends.$.groups': [
                    {
                        name: 'admin8'
                    }
                ]
        }
    },
    function(err, res) {
        console.log(err);
    }
);
*/
// pull
/*
Users.update({
        name: 'xfxu2'
    },
    {
        $pull: {
            friends: {
                name: 'friend4'
            }
        }
    },
    function(err, res) {
        console.log(err);
    }
);
*/
