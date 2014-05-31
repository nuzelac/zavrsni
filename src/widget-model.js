var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    relationship = require('mongoose-relationship'),
    User = require('./user-model'),
    Board = require('./board-model');

var WidgetSchema = new Schema({
    data: { type: String, required: true },
    board: { type: Schema.ObjectId, ref: 'Board', childPath: 'widgets' },
    user: { type: Schema.ObjectId, ref: 'User', childPath: 'widgets' },
});
WidgetSchema.plugin(relationship, { relationshipPathName: ['board', 'user']});

module.exports = mongoose.model('Widget', WidgetSchema);