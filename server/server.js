import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Inquiry from './models/Inquiry.js';
import Booking from './models/Booking.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Dynamic and easy development
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// MongoDB Connection with detailed state logs and graceful fallback
let isDbConnected = false;
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edvantage_uni');
        isDbConnected = true;
        console.log('💚 MongoDB connected successfully.');
    } catch (err) {
        isDbConnected = false;
        console.error('⚠️ MongoDB connection failed:', err.message);
        console.log('💡 Note: Server will continue running using in-memory fallback array for bookings and inquiries.');
    }
};
connectDB();

// Fallback in-memory DB for smooth local development when MongoDB is not running
const memoryInquiries = [];
const memoryBookings = [
    { name: "Demo User", email: "demo@demo.com", phone: "+91 99999 88888", date: "2026-06-01", timeSlot: "11:00 AM" },
    { name: "Demo User", email: "demo@demo.com", phone: "+91 99999 88888", date: "2026-06-01", timeSlot: "2:00 PM" }
];

// Routes

// Get status
app.get('/api/status', (req, res) => {
    res.json({
        status: "healthy",
        databaseConnected: isDbConnected,
        timestamp: new Date()
    });
});

// Create Contact Inquiry
app.post('/api/inquiry', async (req, res) => {
    try {
        const { name, email, phone, destination, service, message } = req.body;
        
        if (!name || !email || !phone || !destination || !service || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (isDbConnected) {
            const newInquiry = new Inquiry({ name, email, phone, destination, service, message });
            await newInquiry.save();
            return res.status(201).json({ message: "Inquiry saved successfully", data: newInquiry });
        } else {
            // Local fallback
            const fallbackInquiry = { name, email, phone, destination, service, message, createdAt: new Date(), _id: Date.now().toString() };
            memoryInquiries.push(fallbackInquiry);
            console.log('📝 Inquiry saved to memory fallback:', fallbackInquiry);
            return res.status(201).json({ message: "Inquiry saved successfully (In-Memory Fallback Mode)", data: fallbackInquiry });
        }
    } catch (err) {
        console.error("Error saving inquiry:", err);
        res.status(500).json({ error: "Failed to save inquiry to server" });
    }
});

// Create Booking Session
app.post('/api/booking', async (req, res) => {
    try {
        const { name, email, phone, date, timeSlot } = req.body;
        
        if (!name || !email || !phone || !date || !timeSlot) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (isDbConnected) {
            // Check for double booking
            const existing = await Booking.findOne({ date, timeSlot });
            if (existing) {
                return res.status(409).json({ error: "This slot is already booked. Please choose another time." });
            }

            const newBooking = new Booking({ name, email, phone, date, timeSlot });
            await newBooking.save();
            return res.status(201).json({ message: "Booking scheduled successfully", data: newBooking });
        } else {
            // Local fallback check
            const alreadyBooked = memoryBookings.some(b => b.date === date && b.timeSlot === timeSlot);
            if (alreadyBooked) {
                return res.status(409).json({ error: "This slot is already booked. Please choose another time." });
            }

            const fallbackBooking = { name, email, phone, date, timeSlot, createdAt: new Date(), _id: Date.now().toString() };
            memoryBookings.push(fallbackBooking);
            console.log('📅 Appointment scheduled in memory fallback:', fallbackBooking);
            return res.status(201).json({ message: "Booking scheduled successfully (In-Memory Fallback Mode)", data: fallbackBooking });
        }
    } catch (err) {
        console.error("Error creating booking:", err);
        res.status(500).json({ error: "Failed to schedule discovery session" });
    }
});

// Get busy timeslots for a given date
app.get('/api/bookings/busy', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: "Date query parameter is required" });
        }

        if (isDbConnected) {
            const bookings = await Booking.find({ date }, 'timeSlot');
            const slots = bookings.map(b => b.timeSlot);
            return res.json({ busySlots: slots });
        } else {
            // Filter memory fallback bookings
            const slots = memoryBookings
                .filter(b => b.date === date)
                .map(b => b.timeSlot);
            return res.json({ busySlots: slots });
        }
    } catch (err) {
        console.error("Error fetching busy slots:", err);
        res.status(500).json({ error: "Failed to fetch busy slots" });
    }
});

// Catch-all simple landing
app.get('/', (req, res) => {
    res.send('EdVantage Uni API running smoothly.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 EdVantage Uni Server is active at http://localhost:${PORT}`);
});
