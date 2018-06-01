const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: {
        type: Number,
        required: true
    }
});


const Exercise = mongoose.model('Exercise', ExerciseSchema);

module.exports = { Exercise };