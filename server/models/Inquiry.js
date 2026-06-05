import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        type: String,
        required: true
    },
    service: {
        type: String,
        required: true,
        enum: ['Counselling', 'Coaching', 'Both']
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);
export default Inquiry;
