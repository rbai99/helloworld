var http = require('http');
var crypto = require('crypto');
var fs = require('fs');
var readline = require('readline');
var uuid = require('node-uuid');
var cookie;
var session_id;
var verify_code;
var cur_username;
var cur_userid;

//var server = '80.240.134.242';
//var server_port = '80';

var server = 'localhost';
var server_port = '3300';

function getcode(user_name){
	var user = {
		username: user_name,
	};

	var content_json_str = JSON.stringify(user);

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': content_json_str.length
	};

	var options = {
		host: server,
		port: server_port,
		path: '/get_verify_code',
		method: 'POST',
		headers: headers
	};

	var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
		    var data_json = JSON.parse(data);
			ret = data_json.ret;
			if (ret == 0){
				verify_code = data_json.verify_code;
				console.log("got code = " + verify_code + " for user " + user_name);
			}else{
			    console.log("get code failed!");
			}
        });
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.write(content_json_str);
	req.end();
}


function signup(usr, pwd){
	//test login req

	var user_signup_json = JSON.stringify(
        {
            username: usr,
            password: pwd,
            verify_code: verify_code,
            device_type: 'android',
            device_token: 'AjSKTwRoW24uejC0lH06GDZNdfXutox5OKeky_jk2WLc',
            car_id: '5394157304ddbf264a85b34c',
            mileage: 50000
        });

    console.log(user_signup_json);

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': user_signup_json.length
	};

	var options = {
		host: server,
		port: server_port,
		path: '/signup',
		method: 'POST',
		headers: headers
	};

	var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (data) {
		    var data_json = JSON.parse(data);
			var ret = data_json.ret;
			console.log("signup return %d", ret);
        });

		cookie = res.headers['set-cookie'][0];
		var pairs = cookie.split(';');
		session_id = pairs[0];
	    console.log(session_id);
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.write(user_signup_json);
	req.end();
}

function login(user_name, pass_word){
	//test login req
	var user = {
		username: user_name,
		password: pass_word
	};

	var user_json = JSON.stringify(user);

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': user_json.length
	};

	var options = {
		host: server,
		port: server_port,
		path: '/login',
		method: 'POST',
		headers: headers
	};

	var req = http.request(options, function (res) {

        res.setEncoding('utf8');
        res.on('data', function (data) {
            var data_json = JSON.parse(data);
            var ret = data_json.ret;
            if (ret == 0) {
                cur_userid = data_json.user_id;
                console.log("login done, user_id %s", cur_userid);
            }
        });

        cookie = res.headers['set-cookie'][0];
		var pairs = cookie.split(';');
		session_id = pairs[0];
        cur_username = user_name;
	    console.log(session_id);
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.write(user_json);
	req.end();
}

function logout(){

	var headers = {
		'Content-Type': 'application/text',
		'Content-Length': 0,
		'cookie': session_id
	};

	var options = {
		host: server,
		port: server_port,
		path: '/logout',
		method: 'GET',
		headers: headers
	};

	var req = http.request(options, function (res) {
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.end();
}

function upload(file_path){

    var file_path_pairs = file_path.split('\/');
	var file_name = file_path_pairs[file_path_pairs.length-1];
	console.log("upload: filename %s", file_name);

	var file = fs.createReadStream(file_path);
    var boundary = uuid();
	console.log("upload: boundary %s", boundary);
	var content_type_str = 'multipart/form-data; boundary='+boundary;
	var headers = {
		'content-type': content_type_str,
		//'Content-Length': 0,
		'cookie': session_id
	};

	var options = {
		host: server,
		port: server_port,
		path: '/file-upload',
		method: 'POST',
		headers: headers
	};

	var req = http.request(options, function (res) {
	});

	req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
	});

    file.on('end',function(){
        req.end('\r\n--' + boundary + '--');
    });

    req.write(
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="file"; filename="'+ file_name + '"\r\n' +
        'Content-Type: application/x-zip-compressed\r\n\r\n'
    );

	file.pipe(req);
}

function download(filename){

	var headers = {
		'Content-Type': 'application/text',
		'Content-Length': 0,
		'cookie': session_id
	};

	var options = {
		host: server,
		port: server_port,
		path: '/download' + '?file=' + filename,
		method: 'GET',
		headers: headers
	};

    var file = fs.createWriteStream(filename);

	var req = http.request(options, function (res) {
        res.on('data', function(data){
            file.write(data);
        }).on('end', function() {
            file.end();
            console.log('download ' + filename + ' done');
        });
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.end();
}

function get_questions(spec_id) {

    console.log("specialist %s", spec_id);
    var req_json = {
        requester: cur_userid
    };
    if (spec_id) {
        req_json.specialist = spec_id;
    }

    var req_json_str = JSON.stringify(req_json);
    console.log(req_json_str);
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': req_json_str.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/get_question',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        var total_data = "";
        var total_data_size = 0;

        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            total_data += chunk;
            total_data_size += chunk.length;
            console.log("recv data %d", chunk.length);
        });
        res.on('end', function(){
            console.log("get question end!");

            var data_json = JSON.parse(total_data);
            var ret = data_json.ret;

            console.log("get question ret %d", ret);
            if (ret == 0) {
                var question_array = data_json.questions;
                console.log("get %d question", question_array.length);
                for(i = 0; i < question_array.length; i++){
                    console.log("question[%d]: %s", i, JSON.stringify(question_array[i]));
                }
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(req_json_str);
    req.end();
}

function submit_question(ques_param, range_param) {
    var dummy_data = new Buffer(8);
    var question_more = {
        question: ques_param,
        range: range_param, // 0 for background process, 1 for send to everyone, 2 for reserved.
        files:[{type:'aud', sub_type:'pcm', data:dummy_data},]
    };
    var question_json = JSON.stringify(question_more);
    console.log(question_json);

    console.log("submit_question: len="+question_json.length);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': question_json.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/submit_question',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
            var data_json = JSON.parse(data);
            var ret = data_json.ret;

            console.log("submit question ret %d", ret);
            if (ret == 0) {
                console.log("new question id %s", data_json.id);
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(question_json);
    req.end();
}

function send_answer(question_id_param, content_param){

    var dummy_data = new Buffer(8);

    var req_json = {
        question_id: question_id_param,
        content: content_param,
        files:[{type:'aud', sub_type:'pcm', data:dummy_data}]
    };

    var req_json_str = JSON.stringify(req_json);
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': req_json_str.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/submit_answer',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
            var data_json = JSON.parse(data);
            var ret = data_json.ret;

            console.log("submit answer ret %d", ret);
            if (ret == 0) {
                console.log("new answer id %s", data_json.id);
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(req_json_str);
    req.end();
}

function list_users() {
    var headers = {
        'Content-Type': 'application/text',
        'Content-Length': 0,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/list_users',
        method: 'GET',
        headers: headers
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (data) {
            var data_json = JSON.parse(data);
            var ret = data_json.ret;
            if (data_json.users){
                for(i=0; i<data_json.users.length; i++){
                    console.log("user %s id %s", data_json.users[i].username, data_json.users[i].userid);
                }
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.end();
}

function delete_user(username_param) {
    console.log("delete user %s", username_param);
    var req_json = {username: username_param};
    var req_json_str = JSON.stringify(req_json);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': req_json_str.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/delete_user',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (data) {
            var data_json = JSON.parse(data);
            console.log("delete user %s return %d", username_param, data_json.ret);
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(req_json_str);
    req.end();
}

function add_spec(ques_id, spec_id) {
    console.log("question id %s spec id %s", ques_id, spec_id);
    var req_json = {
        question_id: ques_id,
        specialist_id: [spec_id]
    };

    var req_json_str = JSON.stringify(req_json);
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': req_json_str.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/update_question',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (data) {
            var data_json = JSON.parse(data);
            var ret = data_json.ret;
            console.log("add specialist for question %s ret %d", ques_id, ret);
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(req_json_str);
    req.end();
}

function get_file(file_id_param) {

    var req_json = {file_id: file_id_param};
    var req_json_str = JSON.stringify(req_json);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': req_json_str.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/get_file',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (data) {
            var data_json = JSON.parse(data);
            var ret = data_json.ret;
            console.log("get_file ret %d", ret);
            if (ret == 0){
                console.log("get_file type %s sub_type %s lenght %d", data_json.type, data_json.sub_type, data_json.data.length);
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(req_json_str);
    req.end();
}

function get_answer(question_id_param) {

    console.log("get_answer: question id %s", question_id_param);

    var req_json = {};
    if (question_id_param)
        req_json.question_id = question_id_param;

    var req_json_str = JSON.stringify(req_json);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': req_json_str.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/get_answer',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        var data = "";
        var data_size = 0;

        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
            data_size += chunk.length;
        });

        res.on('end', function(){
            var data_json = JSON.parse(data);
            var ret = data_json.ret;
            console.log("get_answer ret %d", data_json.ret);
            if (data_json.ret == 0){
                for(i=0; i<data_json.answers.length; i++){
                    console.log("answer[%d]: %s", i, JSON.stringify(data_json.answers[i]));
                }
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(req_json_str);
    req.end();
}

function add_car(vendor_param, family_param) {

    var req_json = {
        vendor: vendor_param,
        family: family_param
    };

    var req_json_str = JSON.stringify(req_json);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': req_json_str.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/new_car',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (data) {
            var data_json = JSON.parse(data);
            var ret = data_json.ret;
            console.log("add car ret %d", ret);
            if (ret == 0){
                console.log("car id %s", data_json.id);
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(req_json_str);
    req.end();
}

function add_info(info_content) {

    var req_json = {
        content: info_content,
        title: 'tips'
    };

    var req_json_str = JSON.stringify(req_json);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': req_json_str.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/submit_info',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            console.log('add info got data %s',data);
            var data_json = JSON.parse(data);
            console.log("add info return %d", data_json.ret);
            if (data_json.ret == 0){
                console.log('info id %s', data_json.id);
            }else{
                console.log('err msg %s', data_json.msg);
            }
        });

    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(req_json_str);
    req.end();
}

function get_info() {

    var req_json = {
    };

    var req_json_str = JSON.stringify(req_json);

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': req_json_str.length,
        'cookie': session_id
    };

    var options = {
        host: server,
        port: server_port,
        path: '/fetch_info',
        method: 'POST',
        headers: headers
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var data_json = JSON.parse(data);
            console.log("get info return %d %d", data_json.ret, data_json.info_list.length);
            if (data_json.ret == 0){
                for(var i=0 ; i < data_json.info_list.length; i++){
                    console.log("info(%d)[%s]", i, JSON.stringify(data_json.info_list[i]));
                }
            }else{
                console.log('err msg %s', data_json.msg);
            }
        });

    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.write(req_json_str);
    req.end();
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', function (cmd) {
    console.log('cmd = '+cmd);

    var inputs = cmd.split(' ');
	if (inputs[0] == 'login'){
	    login(inputs[1], inputs[2]);
	}else if (inputs[0] == 'signup'){
	    signup(inputs[1], inputs[2]);
	}else if (inputs[0] == 'logout'){
	    logout();
	}else if (inputs[0] == 'upload'){
	    upload(inputs[1]);
	}else if (inputs[0] == 'download'){
	    download(inputs[1]);
	}else if (inputs[0] == 'getcode'){
	    getcode(inputs[1]);
    }else if (inputs[0] == 'getques'){
        get_questions(inputs[1]);
    }else if (inputs[0] == 'sendques'){
        submit_question(inputs[1], inputs[2]);
    }else if (inputs[0] == 'list'){
        list_users();
    }else if (inputs[0] == 'addspec'){
        add_spec(inputs[1], inputs[2]);
    }else if (inputs[0] == 'getfile'){
        get_file(inputs[1]);
    }else if (inputs[0] == 'sendanswer'){
        send_answer(inputs[1], inputs[2]);
    }else if (inputs[0] == 'getanswer') {
        get_answer(inputs[1], inputs[2]);
    }else if (inputs[0] == 'deluser'){
        delete_user(inputs[1]);
    }else if (inputs[0] == 'addcar'){
        add_car(inputs[1], inputs[2]);
    }else if (inputs[0] == 'addinfo'){
        add_info(inputs[1]);
    }else if (inputs[0] == 'getinfo'){
        get_info();
    }

});
