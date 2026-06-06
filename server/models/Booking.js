import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
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
    date: {
        type: String, // format YYYY-MM-DD
        required: true
    },
    timeSlot: {
        type: String, // e.g. "10:00 AM", "2:30 PM"
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    emailSent: {
        type: Boolean,
        default: false
    }
});

// Avoid double booking of the exact same slot
bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
