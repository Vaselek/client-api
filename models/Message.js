const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    text: {
        type: String,
        required: true,
    },
    username: {
        type: String
    }
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;


