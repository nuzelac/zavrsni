var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    relationship = require('mongoose-relationship'),
    User = require('./user-model'),
    Board = require('./board-model');

var WidgetSchema = new Schema({
		type: { type: String, required: true },
		x: { type: Number, required: true },
		y: { type: Number, required: true },
		width: Number,
		height: Number,
    data: { type: String, required: true },
    board: { type: Schema.ObjectId, ref: 'Board', childPath: 'widgets' },
    user: { type: Schema.ObjectId, ref: 'User', childPath: 'widgets' },
});
WidgetSchema.plugin(relationship, { relationshipPathName: ['board', 'user']});

module.exports = mongoose.model('Widget', WidgetSchema);
