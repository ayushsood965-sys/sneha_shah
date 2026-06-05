import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Inquiry from './models/Inquiry.js';
import Booking from './models/Booking.js';
import { sendInquiryEmails, sendBookingEmails } from './emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Dynamic and easy development
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// MongoDB Connection with detailed state logs and graceful fallback
let isDbConnected = false;
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        isDbConnected = true;
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edvantage_uni', {
            serverSelectionTimeoutMS: 5000
        });
        isDbConnected = true;
        console.log('💚 MongoDB connected successfully.');
    } catch (err) {
        isDbConnected = false;
        console.error('⚠️ MongoDB connection failed:', err.message);
    }
};

// Middleware to ensure DB connection attempt on every request (crucial for Serverless Vercel environment)
const ensureDBConnection = async (req, res, next) => {
    await connectDB();
    next();
};

app.use(ensureDBConnection);

// Fallback in-memory DB for smooth local development when MongoDB is not running
const memoryInquiries = [];
const memoryBookings = [];

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
            const emailSent = await sendInquiryEmails({ name, email, phone, destination, service, message });
            return res.status(201).json({ message: "Inquiry saved successfully", emailSent, data: newInquiry });
        } else {
            // Local fallback
            const fallbackInquiry = { name, email, phone, destination, service, message, createdAt: new Date(), _id: Date.now().toString() };
            memoryInquiries.push(fallbackInquiry);
            console.log('📝 Inquiry saved to memory fallback:', fallbackInquiry);
            const emailSent = await sendInquiryEmails({ name, email, phone, destination, service, message });
            return res.status(201).json({ message: "Inquiry saved successfully (In-Memory Fallback Mode)", emailSent, data: fallbackInquiry });
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
            const emailSent = await sendBookingEmails({ name, email, phone, date, timeSlot });
            return res.status(201).json({ message: "Booking scheduled successfully", emailSent, data: newBooking });
        } else {
            // Local fallback check
            const alreadyBooked = memoryBookings.some(b => b.date === date && b.timeSlot === timeSlot);
            if (alreadyBooked) {
                return res.status(409).json({ error: "This slot is already booked. Please choose another time." });
            }

            const fallbackBooking = { name, email, phone, date, timeSlot, createdAt: new Date(), _id: Date.now().toString() };
            memoryBookings.push(fallbackBooking);
            console.log('📅 Appointment scheduled in memory fallback:', fallbackBooking);
            const emailSent = await sendBookingEmails({ name, email, phone, date, timeSlot });
            return res.status(201).json({ message: "Booking scheduled successfully (In-Memory Fallback Mode)", emailSent, data: fallbackBooking });
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

// --- ADMIN SYSTEM ROUTES ---

// Admin Login validation
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'info@edvantageuni.com' && password === 'Jupiter@2210') {
        return res.json({ success: true, token: "edvantage_uni_mock_jwt_token_2026" });
    }
    return res.status(401).json({ error: "Invalid username or password" });
});

// Fetch all inquiries
app.get('/api/admin/inquiries', async (req, res) => {
    try {
        if (isDbConnected) {
            const inquiries = await Inquiry.find().sort({ createdAt: -1 });
            return res.json({ inquiries });
        } else {
            return res.json({ inquiries: [...memoryInquiries].reverse() });
        }
    } catch (err) {
        console.error("Error retrieving inquiries:", err);
        res.status(500).json({ error: "Failed to retrieve student inquiries" });
    }
});

// Archive (Delete) an inquiry
app.delete('/api/admin/inquiries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(404).json({ error: "Inquiry not found (Invalid ID format)" });
            }
            const deleted = await Inquiry.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({ error: "Inquiry not found" });
            }
            return res.json({ message: "Inquiry archived successfully" });
        } else {
            const index = memoryInquiries.findIndex(i => i._id === id);
            if (index === -1) {
                return res.status(404).json({ error: "Inquiry not found in memory" });
            }
            memoryInquiries.splice(index, 1);
            return res.json({ message: "Inquiry archived successfully from memory" });
        }
    } catch (err) {
        console.error("Error deleting inquiry:", err);
        res.status(500).json({ error: "Failed to archive inquiry record" });
    }
});

// Fetch all scheduled bookings
app.get('/api/admin/bookings', async (req, res) => {
    try {
        if (isDbConnected) {
            const bookings = await Booking.find().sort({ date: 1, timeSlot: 1 });
            return res.json({ bookings });
        } else {
            // Sort by date then slot
            const sorted = [...memoryBookings].sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.timeSlot.localeCompare(b.timeSlot);
            });
            return res.json({ bookings: sorted });
        }
    } catch (err) {
        console.error("Error retrieving bookings:", err);
        res.status(500).json({ error: "Failed to retrieve discovery bookings" });
    }
});

// Archive (Delete) a booking slot
app.delete('/api/admin/bookings/:id', async (req, res) => {
    console.log("DELETE /api/admin/bookings/:id called with id:", req.params.id);
    try {
        const { id } = req.params;
        if (isDbConnected) {
            console.log("DB connected, checking ObjectId validity for id:", id);
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.warn("Invalid ObjectId format:", id);
                return res.status(404).json({ error: "Booking record not found (Invalid ID format)" });
            }
            const deleted = await Booking.findByIdAndDelete(id);
            console.log("Mongoose findByIdAndDelete returned:", deleted);
            if (!deleted) {
                return res.status(404).json({ error: "Booking record not found" });
            }
            return res.json({ message: "Booking archived successfully" });
        } else {
            console.log("DB not connected, searching memoryBookings for id:", id);
            const index = memoryBookings.findIndex(b => b._id === id);
            if (index === -1) {
                console.warn("Booking not found in memory fallback list.");
                return res.status(404).json({ error: "Booking not found in memory" });
            }
            memoryBookings.splice(index, 1);
            console.log("Successfully removed booking from memory. Remaining count:", memoryBookings.length);
            return res.json({ message: "Booking archived successfully from memory" });
        }
    } catch (err) {
        console.error("Error deleting booking:", err);
        res.status(500).json({ error: "Failed to archive booking record" });
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
