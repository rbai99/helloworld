var express = require('express'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    hash = require('./pass').hash;

var app = express();
var util = require('util');
var fs = require('fs');
var user_code_pair_array = [];
var crypto = require('crypto');

//mongoose...
var async = require('async');
var UserDao = require('./db/dao/userDao');
var GroupDao = require('./db/dao/groupDao');
var UserCarDao = require('./db/dao/userCarDao');
var daoPool = require('./db/dao/mongoose/dao-pool');
var QuestionDao = require('./db/dao/questionDao');

//mongoose model
var User = UserDao.User;
var Question =QuestionDao.Question;
var Answer = QuestionDao.Answer;
var gridFS;

/*
 Helper Functions
 */
function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);
    User.findOne({username: name},function (err, user) {
            if (user) {
                console.log("find user " + user);
                if (err) return fn(new Error('cannot find user'));
                hash(pass, user.salt, function (err, hash) {
                    if (err) return fn(err);
                    if (hash == user.hash) return fn(null, user);
                    fn(new Error('invalid password'));
                });
            } else {
                console.log("No user!");
                return fn(new Error('cannot find user'));
            }
        });
}

function requiredAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

function userExist(req, res, next) {
    User.count({
        username: req.body.username
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            console.log("user %s exist!", req.body.username)
            req.session.error = "User Exist"
            res.redirect("/signup");
        }
    });
}

function getVerifyCode(){
    return "123456";
}

var push_server = {
    username: 'apollo_lai@hotmail.com',
    password: 'chebang2014',
    appkey: '538f8b0f56240ba4ac087104',
    app_master_secret: 'v5amsd1atrubwd7hhvfwntg5zlg0vcyl',
    server: 'msg.umeng.com',
    path: '/api/send'
};

function send_notification(receivers, type, content){
//    console.log("receiver %s type %s content %s", receivers, type, content);
    var msg = {
        appkey: push_server.appkey,          // 必填 应用唯一标识
        timestamp:"",       // 必填 时间戳，10位或者13位均可。
        validation_token:"",// 必填 验证码，validation_token为appkey, app_master_secret与timestamp的md5码, 示例代码参照附录G。注意: appkey,app_master_secret均需要转化为小写。
        type:"unicast",            // 必填 消息发送类型,其值为unicast,broadcast,groupcast,customizedcast或者filecast.
                                //      unicast-单播,
                                //      filecast-文件播(多个device_token可以通过文件形式批量发送）
                                //      broadcast-广播,
                                //      groupcast-组播(按照filter条件筛选特定用户群, 具体请参照filter参数)
                                //      customizedcast(通过开发者定义的alias和友盟的device_tokens进行映射,
                                //        可以传入单个alias, 也可以传入文件id。具体请参照alias和file_id参数)
        device_tokens:"",   // 可选 设备唯一表示
                                //      当type=unicast时,必填, 表示指定的单个设备
                                //      当type=broadcast,groupcast,filecast或者customizedcast时, 无需填写此参数。
        payload:{              // 必填 消息内容(Android最大为1024B, iOS为256B), 包含参数说明如下(JSON格式):
            display_type:"notification",  // 必填 消息类型，值为notification或者message, notification-通知, message-消息.
            body:{               // 必填 消息体。display_type=message时,body的内容只需填写custom字段。display_type=notification时, body可以包含如下参数:
                ticker:type,    // 必填 通知栏提示文字
                title:"chebang",     // 必填 通知标题
                text:content,      // 必填 通知文字描述
                after_open: "go_app"  // 必填 值为"go_app", "go_url", "go_activity", "go_custom"
                                     //      "go_app": 打开应用
                                    //      "go_url": 跳转到URL
                                    //      "go_activity": 打开特定的activity
                                    //      "go_custom": 用户自定义内容。
            }
        },
        production_mode:"true" // 可选 正式\测试模式。 默认为"true"。测试模式下，只会将消息发给测试设备, 测试设备需要到web上添加。测试模式对单播不生效。
    }


    receivers.forEach(function(item, index){
        console.log('send_notification for user %s', item);
        User.findById(item, function(err, user){
            if (user){
                msg.timestamp = (new Date()).valueOf();
                var md5 = crypto.createHash('md5');
                md5.update(msg.appkey + push_server.app_master_secret + msg.timestamp);
                msg.validation_token = md5.digest(encoding='hex');
                //msg.device_tokens = user.device_token;
                msg.device_tokens = 'AjSKTwRoW24uejC0lH06GDZNdfXutox5OKeky_jk2WLc';
                console.log("send_notification: ts %s dt %s md5 %s", msg.timestamp, msg.device_tokens, msg.validation_token);

                //send push request...
                var req_json_str = JSON.stringify(msg);
                var headers = {
                    'Content-Type': 'application/json',
                    'Content-Length': req_json_str.length,
                };

                var options = {
                    host: push_server.server,
                    port: 80,
                    path: push_server.path,
                    method: 'POST',
                    headers: headers
                };

                var req = http.request(options, function (res) {
                    res.setEncoding('utf8');
                    var data = "";

                    res.on('data', function (chunk) {
                        data += chunk;
                    });

                    res.on('end',function(){
                        console.log("get resp from push server:\n " + data);
                        var ret_json = JSON.parse(data);
                    });
                });

                req.on('error', function(e) {
                    console.log('problem with request: ' + e.message);
                });

                req.write(req_json_str);
                req.end();

            }
        });
    });

}

/*
Routes
*/
function main() {


    app.configure(function () {
        app.use(express.logger());
//    app.use(express.bodyParser());
        app.use(express.bodyParser({uploadDir:'./tmp'}));
        app.use(express.cookieParser('Authentication Tutorial '));
        app.use(express.session());
        app.use(express.static(path.join(__dirname, 'public')));
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
    });

    app.use(function (req, res, next) {
        var err = req.session.error,
            msg = req.session.success;
        delete req.session.error;
        delete req.session.success;
        res.locals.message = '';
        if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
        if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
        next();
    });

    app.post("/get_verify_code", function (req, res) {

        if (!req.body.username) {
            console.log("get_verify_code: empty user name!");
            res.contentType('json');
            res.json({ ret: -1});
        }else {
            User.count({
                username: req.body.username
            }, function (err, count) {
                if (count === 0) {
                    console.log("user %s not exist!", req.body.username);
                    var code = getVerifyCode();
                    var user_code_pair = {username: req.body.username, verify_code: code};
                    user_code_pair_array.push(user_code_pair);

                    console.log(user_code_pair_array);

                    res.contentType('json');
                    res.json({ verify_code: code, ret: 0 });

                } else {
                    console.log("user %s exist!", req.body.username);
                    res.contentType('json');
                    res.json({ ret: -1});
                }
            });
        }
    });

    function send_empty_process_page(res){
        response = "<html>\n"
        response += "<head>\n"
        response += "<script type='text/javascript' src='js/main.js'></script>\n"
        response += "</head>\n";
        response += "<body>\n";
        response += "Welcome " + req.session.user.username + "\n";
        response += "</body>\n";
        response += "</html>";
        res.send(response);
    }

    function send_process_page(res, req, questions){
        response = "<html>\n"
        response += "<head>\n"
        response += "<script type='text/javascript' src='js/main.js'></script>\n"
        response += "</head>\n";
        response += "<body>\n";
        response += "<p>Welcome " + req.session.user.username + "</p>\n";
        response += "<p>There are " + questions.length + " questions</p>\n";
        response += "<table border='1'>\n";
        response += "<tr><th>#</th><th>Date</th><th>ID</th><th>Request</th><th>Content</th><th>Specialists</th><th>Answers</th><th>Status</th>";
        for(var i = 0; i < questions.length; i++){
            response += "<tr>\n";
            response += "<td><a href=/question_web?id="+questions[i]._id +">" + i + "</a></td>";
            response += "<td>" + questions[i].timestamp + "</td>";
            response += "<td>" + questions[i]._id + "</td>";
            response += "<td>" + questions[i].requester.username + "</td>";
            response += "<td>" + questions[i].content + "</td>";

            response += "<td>";
            if (questions[i].specialists) {
                for (var j = 0; j < questions[i].specialists.length; j++) {
                    response += questions[i].specialists[j].username + "<br />";
                }
            }
            var answer_count = 0;
            if (questions[i].answers)
                answer_count = questions[i].answers.length;

            response += "</td>";
            response += "<td>" + answer_count + "</td>";
            response += "<td>" + questions[i].status + "</td>";
            response += "</tr>\n";
        }
        response += "</table>\n";
        response += "</body>\n";
        response += "</html>";
        res.send(response);
    }

    app.get("/", function (req, res) {
        //console.log(util.inspect(req));
        if (req.session.user) {
            Question.find().populate('requester').populate('specialists').populate('answers').sort('-update_timestamp').exec(function(err, docs){
                if (err){
                    send_empty_process_page(res);
                }else {
                    if (docs) {
                        send_process_page(res, req, docs);
                    }else{
                        send_empty_process_page(res);
                    }
                }
            });
        } else {
            var response = "";
            response += "<a href='/login'> Login</a><br /><br />\n";
            response += "<a href='/signup'> Sign Up</a><br /><br />\n";
            response += "<a href='/chebang.apk'>apk</a><br /><br />\n";
            res.send(response);
        }
    });

    function send_question_page(req, res, question, specialists_all){
        response = "<html>\n"
        response += "<head>\n"
        response += "<script type='text/javascript' src='js/main.js'></script>\n"
        response += "</head>\n";
        response += "<body>\n";

        response += "<form id='update_question_form' method='POST' action='/update_question_web'>";
        response += "<p>Date: " + question.timestamp + "</p>\n";
        response += "<p>Requester: <a href='/user?id="+ question.requester._id + "'>" + question.requester.username + "</a></p>\n";
        response += "<p>Original content:<br />" + question.content + "</p>\n";

        response += "Audios:<br />\n";
        if (question.files) {
            for(var i=0; i < question.files.length; i++) {
                //response += "[" + i + "] " +  question.files[i]._id + "\n";
                var audio_src = "/get_file?id=" + question.files[i]._id;
                response += "<audio controls='controls'><source src='" + audio_src + "' type='audio/wav' /></audio><br /><br />\n"
            }
        }

        var content2_str = "";
        if (question.content2){
            content2_str = question.content2;
        }
        console.log("content2: " + content2_str);
        response += "<p>Content after process<br />\n<textarea rows='12' cols='70' name='content2'>" + content2_str +"</textarea>></p>\n";

        response += "Sepecialists<br />\n";
        response += "<select name='specialists' size='15' id='specialists' style='min-width:300px' multiple='multiple' ondblclick=\"rm_spec()\">\n";
        if (question.specialists) {
            for (var k = 0; k < question.specialists.length; k++){
                response += "<option value='" + question.specialists[k]._id + "'>" + question.specialists[k].username + "</option>\n";
            }
        }
        response += "<select>\n";

        response += "<select name='specialists_all' size='15' id='specialists_all' style='min-width:300px' multiple='multiple' ondblclick=\"add_spec()\">\n";
        if (specialists_all) {
            for (var m = 0; m < specialists_all.length; m++) {
                //response += "<option value='" + specialists_all[m]._id + "' ondblclick=\"add_spec()\">" + specialists_all[m].username + "</option>\n";
                response += "<option value='" + specialists_all[m]._id + "'>" + specialists_all[m].username + "</option>\n";
            }
        }
        response += "<select><br />\n";

        response += "Answers:<br />\n";
        if (question.answers){
            for(var j=0; j < question.answers.length; j++){
                var href_str = '/get_answer_web?id=' + question.answers[j]._id + '&question_id=' + question._id;
                response += "<a href='" + href_str + "'>[" + j + "]  " + question.answers[j]._id + " visble = " + question.answers[j].visible + "</a><br />\n";
            }
        }

        response += "<br />Status\n";
        response += "<select name='status' value='"+ question.status + "'>\n";

        var sel_str = ["", "", "", ""];

        if (question.status == 'new'){
            sel_str[0] = 'selected="selected"';
        }else if (question.status == 'open'){
            sel_str[1] = 'selected="selected"';
        }else if (question.status == 'close'){
            sel_str[2] = 'selected="selected"';
        }else if (question.status == 'invalid'){
            sel_str[3] = 'selected="selected"';
        }

        response += "<option value='new' " + sel_str[0] +">New</option>\n";
        response += "<option value='open' " + sel_str[1] +">Open</option>\n";
        response += "<option value='close' " + sel_str[2] +">Close</option>\n";
        response += "<option value='invalid " + sel_str[3] +"'>Invalid</option>\n";
        response += "</select><br /><br />\n";

        response += "<input type='checkbox' name='delete' value='1'/>Delete<br /><br />\n";
        response += "<input type='submit' id='sb' value='submit' onclick=\"submit_check()\"/>\n";

        response += "<input type='hidden' id='specialist_hide' name='specialist_hide'/>";
        response += "<input type='hidden' id='question_hide' name='question_id' value='" + question._id + "'/>";

        response += "</form>\n";

        response += "</body>\n";
        response += "</body>\n";
        response += "</html>";
        res.send(response);
    }

    app.get("/question_web", function (req, res) {
        if (req.session.user) {
            if (req.query && req.query.id) {
                console.log("get question from web " + req.query.id);
                Question.findById(req.query.id).populate('requester').populate('specialists').populate('answers').populate('files').exec(function(err, doc) {
                    if (doc) {
                        console.log('find question');
                        User.find(function(err, users){
                            if (err){
                                res.redirect('/');
                            }else {
                                send_question_page(req, res, doc, users);
                            }
                        });
                    }else{
                        console.log('not find question');
                        res.redirect('/');
                    }
                });
            }else{
                res.redirect('/');
            }
        }else{
            console.log("not login!");
            res.redirect('/');
        }
    });

    app.get("/signup", function (req, res) {
        //console.log(util.inspect(req));
        if (req.session.user) {
            res.redirect("/");
        } else {
            res.render("signup");
        }
    });

    app.post("/signup", userExist, function (req, res) {
        //console.log(util.inspect(req));

        var password = req.body.password;
        var username = req.body.username;
        var verify_code = req.body.verify_code;
        console.log("signup %s %s %s", username, password, verify_code);

        var pass = 0;
        for (i = 0; i < user_code_pair_array.length; i++) {
            if (user_code_pair_array[i].username == username) {
                if (user_code_pair_array[i].verify_code == verify_code) {
                    user_code_pair_array.splice(i, 1);
                    console.log("signup: verify pass!");
                    pass = 1;
                    break;
                }
            }
        }

        console.log(pass);

        if (pass == 0) {
            console.log("signup faild, wrong verify code %s!", verify_code);
            res.contentType('json');
            res.json({ ret: -1});
        } else {
            hash(password, function (err, salt, hash) {
                if (err) throw err;
                var user = new User({
                    username: username,
                    salt: salt,
                    hash: hash,
                }).save(function (err, newUser) {
                        if (err) throw err;
                        authenticate(newUser.username, password, function (err, user) {
                            if (user) {
                                req.session.regenerate(function () {
                                    req.session.user = user;
                                    req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                                    res.contentType('json');
                                    res.json({ ret: 0});
                                    //res.redirect('/');
                                });
                            }
                        });
                    });
            });
        }
    });

    app.get("/login", function (req, res) {
        //console.log(util.inspect(req));
        res.render("login");
    });

    app.post("/login", function (req, res) {
        //console.log(util.inspect(req));
        authenticate(req.body.username, req.body.password, function (err, user) {
            if (user) {
                console.log("user %s login", req.body.username);
                req.session.regenerate(function () {
                    req.session.user = user;
                    req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                    res.contentType('json');
                    res.json({ ret: 0, user_id: req.session.user._id});
                });
            } else {
                req.session.error = 'Authentication failed, please check your ' + ' username and password.';
                res.contentType('json');
                res.json({ ret: -1});
            }
        });
    });

    app.post("/login_web", function (req, res) {
        console.log("login from web!");
        authenticate(req.body.username, req.body.password, function (err, user) {
            if (user) {
                console.log("user %s login", req.body.username);
                req.session.regenerate(function () {
                    req.session.user = user;
                    req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                    res.redirect('/');
                });
            } else {
                req.session.error = 'Authentication failed, please check your ' + ' username and password.';
                res.redirect('/');
            }
        });
    });

    app.get('/logout', function (req, res) {

        if (req.session.user) {
            console.log("user %s logout", req.session.user.username);
        } else {
            console.log("not login!");
        }

        req.session.destroy(function () {
            res.redirect('/');
        });
    });

    app.get('/profile', requiredAuthentication, function (req, res) {

        //console.log(util.inspect(req));

        res.send('Profile page of ' + req.session.user.username + '<br>' + ' click to <a href="/logout">logout</a>');
    });

    app.get('/upload', function (req, res) {
        //console.log(util.inspect(req));
        var response = "upload file...\n";
        response += "<form method='post' enctype='multipart/form-data' action='/file-upload'>\n";
        response += "<input type='file' name='file'>\n";
        response += "<input type='submit'>\n";
        response += "</form>\n";
        res.send(response);
    });

    app.post('/file-upload', function (req, res, next) {
        console.log("upload file...");
//    console.log(util.inspect(req));
//    console.log(req);
        console.log(req.files);

        var tmp_path = req.files.file.path;
        var target_path = "./upload/" + req.session.user.username + "/";

        if (!fs.existsSync("./upload"))
            fs.mkdirSync("./upload", 0777);

        if (!fs.existsSync(target_path))
            fs.mkdirSync(target_path, 0777);

        target_path += req.files.file.name;
        console.log("move file from %s to %s", tmp_path, target_path);
        fs.rename(tmp_path, target_path, function (err) {
            if (err) throw err;
            fs.unlink(tmp_path, function () {
                if (err) throw err;
            });
        });

//	res.send("upload done...");
        res.redirect("/");
    });

    app.get('/download', function (req, res) {
        //console.log(util.inspect(req.query.file));

        var path = "./upload/" + req.session.user.username + "/" + req.query.file;
        console.log("download %s...", path);

        var file = fs.createReadStream(path);

        res.header('Content-Type', file.contentType);
        res.header('Content-Disposition', 'attachment; filename=' + req.query.file);

        file.pipe(res);
    });

    app.get('/json', function (req, res) {
        console.log(req.body);
        console.log(req.session);

        res.contentType('json');
        res.send(JSON.stringify({ status: "success" }));
        res.end();
    });

    app.post('/get_question', function(req,res){
        if (req.session.user) {
            console.log("user %s %s want question list", req.session.user.username, req.session.user._id);
            var query = {};
            if (req.body.requester) {
                query.requester = req.body.requester;
                console.log("get_question: requester %s", req.body.requester);
            }
            console.log("get_question: " + JSON.stringify(query));

            Question.find(query, function(err, questions){

                console.log("user %s has %d question\n",
                    req.body.requester, questions.length);

                var questions_json = [];
                for(i = 0; i < questions.length; i++) {
                    console.log("id %s content %s specialists %s",
                        questions[i]._id,  questions[i].content,  questions[i].specialists);

                        var question_json = {
                            id: questions[i]._id,
                            question: questions[i].content,
                            files: questions[i].files,
                            answers: questions[i].answers}

                        if (req.body.specialist) {
                            if (questions[i].specialists){
                                for(k=0; k < questions[i].specialists.length; k++) {
                                    if (req.body.specialist == questions[i].specialists[k]) {
                                        questions_json.push(question_json);
                                    }
                                }
                            }
                        }else {
                            questions_json.push(question_json);
                        }
                }
                res.contentType('json');
                res.json({questions:questions_json, ret:0});
            });
        }else {
            console.log("user not login!");
            res.contentType('json');
            res.json({ret:-1});
        }
    });

    app.post('/submit_question', function(req,res){
        if (req.session.user) {
            console.log("user %s submit question %s", req.session.user.username, req.body.question);
            if (req.body.question) {
                console.log(req.body);
            }

            var date_str = Date();
            var new_ques = {
                requester: req.session.user._id,
                content: req.body.question,
                status: 'new',
                timestamp: date_str,
                update_timestamp: date_str,
                files: []
            };

            if (req.body.files) {
                console.log("prepare save %d files", req.body.files.length);
                for (var i = 0; i < req.body.files.length; i++) {
                    gridFS.save(req.body.files[i].data, req.body.files[i].type, req.body.files[i].sub_type,
                        function (file) {
                            new_ques.files.push(file._id);
                            if (new_ques.files.length == req.body.files.length) {
                                var question = new Question(new_ques).save(function (err, new_question) {
                                    console.log("post question done!");
                                    res.contentType('json');
                                    res.json({ret: 0, id: new_question._id});
                                });
                            }
                        });
                    }
            } else{
                var question = new Question(new_ques).save(function (err, new_question) {
                    console.log("post question done!");
                    res.contentType('json');
                    res.json({ret: 0, id: new_question._id});
                });
            }
        }else {
            console.log("user not login!");
            res.contentType('json');
            res.json({ret:-1});
        }
    });

    app.get('/list_users', function(req,res){
        User.find(function(err,users){
            var resp_json = [];
            for(i=0; i<users.length; i++){
                resp_json.push({username: users[i].username, userid: users[i]._id});
                console.log("user: %s %s", users[i].username, users[i]._id);
            }
            res.contentType('json');
            res.json({ret:0, users: resp_json});
        });
    });

    app.post('/delete_user', function(req,res){
        console.log("delete user %s", JSON.stringify(req.body));
        var resp_sent = 0;
        User.find({username: req.body.username}, function(err,users){
            for(i=0; i<users.length; i++){
                users[i].remove(function(err, doc){
                    console.log("user %s removed", req.body.username);
                    if (resp_sent == 0) {
                        res.contentType('json');
                        res.json({ret: 0});
                        resp_sent = 1;
                    }
                });
            }
        });
    });

    app.post('/update_question', function(req,res) {
        if (req.session.user) {
            console.log(req.body);
            if (req.body.question_id && req.body.specialist_id) {
                Question.findById(req.body.question_id, function (err, question) {
                    console.log('update question %s spec %s', JSON.stringify(question), req.body.specialist_id);
                    question.specialists.push(req.body.specialist_id);
                    question.update_timestamp = Date();
                    question.save(function(err){
                        res.contentType('json');
                        res.json({ret:0});
                    });
                });
            }else{
                res.contentType('json');
                res.json({ret:-1});
            }
        }
    });

    app.post('/update_question_web', function(req,res) {
        if (req.session.user) {
            console.log(JSON.stringify(req.body));
            if (req.body.delete){
                console.log("delete question %s", req.body.question_id);
                Question.findById(req.body.question_id, function(err, doc){
                    if (doc){
                        doc.remove(function(err, removed_doc){
                            res.redirect('/question_web');
                        });
                    }
                });
            }else{
                Question.findById(req.body.question_id, function(err, doc){
                    if (doc){
                        doc.status = req.body.status;
                        doc.content2 = req.body.content2;
                        if (req.body.specialist_hide.length > 0) {
                            var specialists_array = req.body.specialist_hide.split(',');
                            for (var i = 0; i < specialists_array.length; i++) {
                                doc.specialists.push(specialists_array[i]);
                            }
                            send_notification(specialists_array, '0', 'new question ' + req.body.question_id);
                        }
                        doc.update_timestamp = Date();
                        doc.save(function(){
                            res.redirect('/question_web');
                        });
                    }
                });
            }
        }
    });

    app.post('/get_file', function(req,res) {
        if (req.session.user) {
            if (req.body.file_id) {
                console.log("get_file: file id %s", req.body.file_id);
                gridFS.load(req.body.file_id, function (file_doc) {
                    if (file_doc) {
                        console.log("got file type %s sub_type %s len %d", file_doc.type, file_doc.sub_type, file_doc.chunk.length);
                        var resp_json = {ret: 0, type: file_doc.type, sub_type: file_doc.sub_type, data: file_doc.chunk};
                        res.contentType('json');
                        res.json(resp_json);
                    } else {
                        console.log("can not find file by id %s", req.body.file_id);
                        res.contentType('json');
                        res.json({ret: -1});
                    }
                });
            } else {
                res.contentType('json');
                res.json({ret: -1});
            }
        }else{
            console.log("user not login!");
            res.contentType('json');
            res.json({ret:-1});
        }
    });

    app.get('/get_file', function(req,res) {
        if (req.session.user) {
            if (req.query && req.query.id) {
                console.log("get_file: id %s", req.query.id);
                gridFS.load_stream(req.query.id, function (stream) {
                    if (stream) {
                        res.header('Content-Disposition', 'attachment; filename=' + req.query.id);
                        stream.pipe(res);
                    } else {
                        res.send('', 404);
                    }
                });
            } else {
                res.send('', 404);
            }
        }else{
            res.send('', 404);
        }
    });

    app.post('/submit_answer', function(req,res){
        if (req.session.user) {

            console.log("user %s submit answer %s for question %s",
                req.session.user.username, req.body.content, req.body.question_id);

            if (req.body.question_id) {

                var new_query = {
                    answer_user_id: req.session.user._id,
                    content: req.body.content,
                    visible: 'false',
                    files: []
                };

                var new_answer = new Answer(new_query);

                if (req.body.files) {
                    for (var i = 0; i < req.body.files.length; i++) {
                        gridFS.save(req.body.files[i].data, req.body.files[i].type, req.body.files[i].sub_type,
                            function (file) {
                                new_answer.files.push(file._id);
                                if (new_answer.files.length == req.body.files.length) {
                                    new_answer.save(function (err, answer_doc) {
                                        Question.findById(req.body.question_id, function(err, question_doc){
                                            question_doc.answers.push(new_answer._id);
                                            question_doc.save(function(err, doc) {
                                                console.log("submit answer done, !");
                                                res.contentType('json');
                                                res.json({ret: 0, id: answer_doc._id});
                                            });
                                        });
                                    });
                                }
                            });
                    }
                }else{
                    //save directly...
                    new_answer.save(function (err, answer_doc) {
                        Question.findById(req.body.question_id, function(err, question_doc){
                            question_doc.answers.push(new_answer._id);
                            question_doc.save(function(err, doc) {
                                console.log("submit answer done, !");
                                res.contentType('json');
                                res.json({ret: 0, id: answer_doc._id});
                            });
                        });
                    });
                }
            }else {
                console.log("No such question!");
                res.contentType('json');
                res.json({ret:-1, msg: 'No such question'});
            }
        }else {
            console.log("user not login!");
            res.contentType('json');
            res.json({ret:-1});
        }
    });

    app.post('/get_answer', function(req,res){
        if (req.session.user) {
            var resp_json = [];
            if (req.body.question_id){
                Question.findById(req.body.question_id).populate('answers').exec(function(err, doc){
                    console.log("there are %d answers for question %s", doc.answers.length, req.body.question_id);
                    for(var i = 0; i < doc.answers.length; i++){
                        resp_json.push({id: doc.answers[i]._id, content: doc.answers[i].content, files: doc.answers[i].files});
                        console.log("answer id %s content %d", doc.answers[i]._id, doc.answers[i].content);
                    }
                    res.contentType('json');
                    res.json({ret: 0, answers: resp_json});
                });
            }else {
                Answer.find({}, function (err, docs) {
                    console.log("there are %d answers", docs.length);
                    if (docs) {
                        for (i = 0; i < docs.length; i++) {
                            resp_json.push({id: docs[i]._id, content: docs[i].content, files: docs[i].files});
                            console.log("answer id %s content %d", docs[i]._id, docs[i].content);
                        }
                        res.contentType('json');
                        res.json({ret: 0, answers: resp_json});
                    } else {
                        res.contentType('json');
                        res.json({ret: -1, msg: "No answer!"});
                    }
                });
            }
        }else{
            res.contentType('json');
            res.json({ret: -1, msg:"user not login"});
        }
    });

    app.post('/update_answer', function(req,res){
        if (req.session.user) {
            if (req.body.id){
                Answer.findById(req.body.id, function(err, doc){
                    if (doc){
                        doc.state = req.body.state;
                        doc.save(function(err){
                            res.contentType('json');
                            res.json({ret: 0});
                        });
                    }else{
                        res.contentType('json');
                        res.json({ret: -1, msg:"Wrong answer ID"});
                    }
                });
            }else{
                res.contentType('json');
                res.json({ret: -1, msg:"Wrong answer ID"});
            }
        }else{
            res.contentType('json');
            res.json({ret: -1, msg:"user not login"});
        }
    });

    function send_answer_page(req,res, answer, question_id){
        response = "<html>\n"
        response += "<head>\n"
        response += "<script type='text/javascript' src='js/main.js'></script>\n"
        response += "</head>\n";
        response += "<body>\n";

        response += "<form id='update_answer_form' method='POST' action='/update_answer_web'>";
        response += "<p>Date: " + answer.timestamp + "</p>\n";
        response += "<p>Requester: <a href='/user?id="+ answer.answer_user_id._id + "'>" + answer.answer_user_id.username + "</a></p>\n";
        response += "<p>Original content:<br />" + answer.content + "</p>\n";

        response += "Audios:<br />\n";
        if (answer.files) {
            for(var i=0; i < answer.files.length; i++) {
                var audio_src = "/get_file?id=" + answer.files[i]._id;
                response += "<audio controls='controls'><source src='" + audio_src + "' type='audio/wav' /></audio><br /><br />\n"
            }
        }

        var content2_str = "";
        if (answer.content2){
            content2_str = answer.content2;
        }
        console.log("content2: " + content2_str);
        response += "<p>Content after process<br />\n<textarea rows='12' cols='70' name='content2'>" + content2_str +"</textarea>></p>\n";

        response += "<input type='checkbox' name='delete' value='1'/>Delete<br /><br />\n";
        response += "<input type='hidden' id='answer_id_hide' name='answer_id' value='" + answer._id + "'/>";
        response += "<input type='hidden' id='question_id_hide' name='question_id' value='" + question_id + "'/>";
        response += "<input type='submit' id='sb' value='submit'/>\n";

        response += "</form>\n";

        response += "</body>\n";
        response += "</body>\n";
        response += "</html>";
        res.send(response);

    }

    app.get('/get_answer_web', function(req,res){
        if (req.session.user) {
            if (req.query && req.query.id){
                Answer.findById(req.query.id).populate('answer_user_id').populate('files').exec(function(err, doc){
                    if (err ){
                        res.send('no such answer', 404);
                    }else{
                        if (doc){
                            send_answer_page(req, res, doc, req.query.question_id);
                        }else{
                            res.send('no such answer', 404);
                        }
                    }
                });
            }else{
                res.send('no such answer', 404);
            }
        }else{
            res.redirect('/login');
        }
    });

    app.post('/update_answer_web', function(req,res){
        console.log(JSON.stringify(req.body));
        if (req.session.user) {
            if (req.body.answer_id) {
                if (req.body.delete) {
                    Answer.findById(req.body.answer_id, function(err, doc){
                        if (doc) {
                            doc.remove(function (err, removed_doc) {
                                Question.findById(req.body.question_id, function(err, question_doc){
                                    if (question_doc){

                                        for (var i = 0; i < question_doc.answers.length; i++) {
                                            if (question_doc.answers[i] == req.body.answer_id) {
                                                question_doc.answers.splice(i, 1);
                                                break;
                                            }
                                        }

                                        question_doc.save(function (err, saved_question){
                                            res.redirect('/question_web?id=' + req.body.question_id);
                                        });

                                    }else{
                                        res.redirect('/question_web?id=' + req.body.question_id);
                                    }
                                });
                            });
                        }else{
                            res.send('can not find answer', 404);
                        }
                    });
                } else {
                    Answer.findById(req.body.answer_id, function (err, doc) {
                        if (doc) {
                            doc.content2 = req.body.content2;
                            doc.visible = 'true';
                            doc.save(function (err) {
                                res.redirect('/question_web?id=' + req.body.question_id);
                            });
                        } else {
                            res.send('can not find answer', 404);
                        }
                    });
                }
        }else{
            res.send('No answer id', 404);
        }
    }else{
            console.log('user not login');
            res.redirect('/login');
        }
    });

    http.createServer(app).listen(80);
}

// Database
daoPool.createMongoosePool(function() {
    gridFS = require('./db/dao/gridfsDao');
    GroupDao.Check(function(){
        main();
    });
});
