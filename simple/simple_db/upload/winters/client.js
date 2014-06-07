var http = require('http');
var crypto = require('crypto');
var fs = require('fs');
var readline = require('readline');
var uuid = require('node-uuid');
var cookie;
var session_id;
var verify_code;

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
		host: 'localhost',
		port: 3000,
		path: '/get_verify_code',
		method: 'GET',
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

	var user_signup_json = JSON.stringify({username: usr, password: pwd, verify_code: verify_code})
    console.log(user_signup_json);

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': user_signup_json.length
	};

	var options = {
		host: 'localhost',
		port: 3000,
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
		host: 'localhost',
		port: 3000,
		path: '/login',
		method: 'POST',
		headers: headers
	};

	var req = http.request(options, function (res) {
		cookie = res.headers['set-cookie'][0];
		var pairs = cookie.split(';');
		session_id = pairs[0];		
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
		host: 'localhost',
		port: 3000,
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
		host: 'localhost',
		port: 3000,
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
		host: 'localhost',
		port: 3000,
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
	}
});