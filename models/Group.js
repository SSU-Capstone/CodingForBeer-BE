const mongoose = require('mongoose');

// Define the schema for a group
const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, 
        trim: true, 
        uniuqe: true
    },
    users: [{
        type: Number, //first user is leader of the group
    }],
    documents: [{
        type: String,
    }],
    }, {
    timestamps: true, 
    });

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
