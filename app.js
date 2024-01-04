const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = 4000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Crud-Database', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define a mongoose schema for user data
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// Create a User model from the schema
const User = mongoose.model('User', userSchema);

// Serve your static files (if any)
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('login');
});

// Middleware for parsing JSON requests
app.use(bodyParser.json());

// Define routes
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Create a new user instance
    const newUser = new User({
      name,
      email,
      password,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on : ${port}`);
});
