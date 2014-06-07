var async = require('async');

var QuestionDao = require('../../lib/dao/questionDao');
var Question = QuestionDao.Question;

var QuestionData = [
    {
        content: 'Where is my car?',
        multiMediaFileName: '538965e087c24d0a51a49b32',
        requester: '53894a9feb311a7d452378fc',
        tempAnswers: [],
        finalAnswer: [],
        state: QuestionDao.state.content,
        status: QuestionDao.status.open
    },
];


exports.test = function() {

    async.each(QuestionData, function(item, next) {
        console.log(item);

        Question.create(item, next);
    }, function(err) {
        //console.log(err);
    });
}