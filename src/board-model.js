var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    relationship = require('mongoose-relationship'),
    User = require('./user-model'),
    Widget = require('./widget-model'),
    DeleteRequest = require('./delete-request-model');

var BoardSchema = new Schema({
    topic: { type: String, required: true },
    admins: [{ type:Schema.ObjectId, ref: 'User', childPath: 'administers' }],
    users: [{ type:Schema.ObjectId, ref: 'User', childPath: 'boards' }],
    widgets: [{ type: Schema.ObjectId, ref: 'Widget' }],  
    deleteRequests: [{ type: Schema.ObjectId, ref: 'DeleteRequest' }],  
});
BoardSchema.plugin(relationship, { relationshipPathName: ['admins', 'users']});

module.exports = mongoose.model('Board', BoardSchema);