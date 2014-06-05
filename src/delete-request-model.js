var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    relationship = require('mongoose-relationship'),
    User = require('./user-model'),
    Board = require('./board-model'),
    Widget = require('./widget-model');

var DeleteRequestSchema = new Schema({
    board: { type: Schema.ObjectId, ref: 'Board', childPath: 'deleteRequests' },
    user: { type: Schema.ObjectId, ref: 'User', childPath: 'deleteRequests' },
    widget: { type: Schema.ObjectId, ref: 'Widget', childPath: 'deleteRequests'},
});

DeleteRequestSchema.plugin(relationship, { relationshipPathName: ['board', 'user', 'widget']});

module.exports = mongoose.model('DeleteRequest', DeleteRequestSchema);
