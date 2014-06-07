var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Collection = require('./collections');

var AnswerSchema = new Schema({
    answer_user_id: {type: Schema.Types.ObjectId, ref: Collection.usersCollection},
    content: {type: String},
    content2: {type: String},
    files: [{type: Schema.Types.ObjectId, ref: Collection.fsFilesCollection}],
    state: {type: String},
    timestamp: {type: String},
    visible: {type: String}
});

var QuestionSchema = new Schema({
    requester:  {type: Schema.Types.ObjectId, ref: Collection.usersCollection},
    content: {type: String},
    content2: {type: String},
    files: [{type: Schema.Types.ObjectId, ref: Collection.fsFilesCollection}],
    specialists: [{type: Schema.Types.ObjectId, ref: Collection.usersCollection}],
    answers: [{type: Schema.Types.ObjectId, ref: Collection.answerCollection}],
    state: {type: String},
    status: {type: String},
    timestamp: {type: String},
    update_timestamp: {type: String}
});

var Question = mongoose.model(Collection.questionsCollection, QuestionSchema);
var Answer = mongoose.model(Collection.answerCollection, AnswerSchema);
// state of answer
exports.answer_state = {
    media: 'state_media',
    content: 'state_content',
    accept: 'state_accept'
}

// state
exports.state = {
    media: 'state_media',
    content: 'state_content',
    hasAnswer: 'state_has_answer',
    bestSelected: 'state_best_selected'
}

// status
exports.status = {
    open: 'status_open',
    close: 'status_close',
    invalid: 'status_invalid'
};

exports.Question = Question;
exports.Answer = Answer;