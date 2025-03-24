require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1); // Stop the server if DB connection fails
  });

// Define Schema & Model
const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  section: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  transactionId: { type: String, required: true, unique: true },
  paymentProof: { type: String },
}, { timestamps: true });

const Registration = mongoose.model('Registration', registrationSchema);

// Multer Setup for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Routes
app.post('/submit-registration', upload.single('paymentProof'), async (req, res) => {
  try {
    const { name, rollNumber, section, department, year, transactionId } = req.body;
    const paymentProof = req.file ? req.file.path : null;

    // Check for duplicate rollNumber or transactionId
    const existingUser = await Registration.findOne({ $or: [{ rollNumber }, { transactionId }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Roll number or transaction ID already exists' });
    }

    const newRegistration = new Registration({
      name,
      rollNumber,
      section,
      department,
      year,
      transactionId,
      paymentProof,
    });

    await newRegistration.save();
    res.status(201).json({ message: '✅ Registration successful' });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    res.status(500).json({ message: 'Registration failed, please try again' });
  }
});

app.get('/registrations', async (req, res) => {
  try {
    const registrations = await Registration.find();
    res.status(200).json(registrations);
  } catch (error) {
    console.error('❌ Error fetching registrations:', error);
    res.status(500).json({ message: 'Error fetching registrations' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
