var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    relationship = require('mongoose-relationship'),
    User = require('./user-model'),
    Board = require('./board-model');

var JoinRequestSchema = new Schema({
    board: { type: Schema.ObjectId, ref: 'Board', childPath: 'requests' },
    user: { type: Schema.ObjectId, ref: 'User', childPath: 'requests' },
});
JoinRequestSchema.plugin(relationship, { relationshipPathName: ['board', 'user']});

module.exports = mongoose.model('JoinRequest', JoinRequestSchema);
