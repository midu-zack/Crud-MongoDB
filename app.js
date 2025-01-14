const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const { name } = require('ejs');
 
const app = express();
const port = 5000;


//middleware u
app.use(bodyParser.urlencoded({ extended: true }));
   
app.set('view engine', 'ejs');
app.set('views', './views');


// Connect  MongoDB
mongoose.connect('mongodb://localhost:27017/Collections-Data', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });


const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//  schema for user data
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});


// create user model to the schema
const User = mongoose.model('User', userSchema);

 
app.get('/', (req, res) => {
  res.redirect('/login')
});

app.get('/login', (req, res) => {
  res.render('login', { message: '' });
});


// handel the login submission
app.post('/login', async (req, res) => {

  console.log(req.body);

  const { name, password } = req.body;

  // console.log("data",req.body);
  
  try {
    //finding the name
    const user = await User.findOne({ name });

    if (!user) {
      return res.render('login', { message: 'User not exist. Please sign up.' });
    }
    //password hashing
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render('login', { message: 'Incorrect password. Please try again.' });
    }
    res.redirect('/logged?name=' + user.name);
  
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
});



 
app.get('/signup', (req, res) => {
  res.render('signup');
});

 
// handle signup form submission
app.post('/signup', async (req, res) => {

  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      let errorMessage = '';
      if (existingUser.name === name) {
        errorMessage = 'Username already exists. Please choose another username.';
      }
      return res.render('signup', { errorMessage });
    }
    const hashedPassword = await bcrypt.hash(password, 8);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    res.redirect('/logged?name=' + name);
  } catch (error) {
    res.status(500).json({ message: 'Sign up failed', error });
  }
});




// logged page 
app.get('/logged', async (req, res) => {
    try {
    const { name } = req.query;
    // check
    const user = await User.findOne({ name });
    if (!user) {
        return res.status(404).json({ message: 'Invalid Login Information' });
    }
    const { email } = user;
    res.render('logged', { name, email });
    } catch (error) {
    res.status(500).json({ message: 'Error fetching user details', error });
    }
});


// render the update page
app.get('/update', async (req, res) => {
  try {

    const { name } = req.query;
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ errors: 'No Matching User Found' });
    }

     
    res.render('update', {
      name: user.name,
      email: user.email,
      errors: {},  
    });
  } catch (error) {
    res.status(500).json({ errors: 'Error fetching user data for update', error });
  }
});



// handel the  update and password
app.post('/update', async (req,res) => {
  const { name, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ errors: 'User not found' });
    }

    // validate current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.render('update', {
        name,
        email: user.email,
        errors: { currentPassword: 'Incorrect current password' },
      });
    }

    //  validation for the new password 
    if (!newPassword || newPassword.trim() === '' || newPassword.length < 6) {
      return res.render('update', {
        name,
        email: user.email,
        errors: { newPassword: 'New Password must be at least 6 characters long' },
      });
    }

    //update the user data (new password)
    user.password = await bcrypt.hash(newPassword, 8);

    await user.save();

    res.redirect(`/logged?name=${encodeURIComponent(user.name)}`);  
  } catch (error) {
    res.status(500).json({ errors: 'Error updating user data', error });
  }
  
});



// express route for delete
app.post('/delete', async (req, res) => {
  try {
    const { name } = req.body;
    console.log("name :" , req.body);

    const deletedUser = await User.findOneAndDelete({ name })
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.redirect('/login');   
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
});




app.listen(port, () => {
  console.log(`Server running on : ${port}`);
});
