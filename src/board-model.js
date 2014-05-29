var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    relationship = require('mongoose-relationship'),
    User = require('./user-model');

var BoardSchema = new Schema({
    topic: { type: String, required: true },
    admins: [{ type:Schema.ObjectId, ref: 'User', childPath: 'administers' }],
    users: [{ type:Schema.ObjectId, ref: 'User', childPath: 'boards' }],
});
BoardSchema.plugin(relationship, { relationshipPathName: ['admins', 'users']});

module.exports = mongoose.model('Board', BoardSchema);