/**
 * Created by xfxu on 14-5-29.
 */

var parse = module.exports;

parse.parseReq = function(req, next) {
    if (req.body.data) {
        //能正确解析 json 格式的post参数
        next(req.body);
    } else {
        //不能正确解析json 格式的post参数
        var body = '', jsonStr;
        req.on('data', function (chunk) {
            body += chunk; //读取参数流转化为字符串
        });
        req.on('end', function () {
            //读取参数流结束后将转化的body字符串解析成 JSON 格式
            try {
                jsonStr = JSON.parse(body);
            } catch (err) {
                jsonStr = null;
            }

            next(jsonStr);
        });
    }
};