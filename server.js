const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Define schema and model
const registrationSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  section: String,
  department: String,
  year: String,
  transactionId: String,
  paymentProof: String,
});

const Registration = mongoose.model('Registration', registrationSchema);

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Routes
app.post('/submit-registration', upload.single('paymentProof'), async (req, res) => {
  try {
    const { name, rollNumber, section, department, year, transactionId } = req.body;
    const paymentProof = req.file ? req.file.path : '';

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
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.get('/registrations', async (req, res) => {
  try {
    const registrations = await Registration.find();
    res.status(200).json(registrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching registrations' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});