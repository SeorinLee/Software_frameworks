const mongoose = require('mongoose');

// User schema definition
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: [String],
  groups: [
    {
      groupId: String,
      status: { type: String, enum: ['Pending', 'Accepted'], default: 'Pending' }
    }
  ],
  dob: { type: Date, required: true },
  profilePictureUrl: { type: String }  // Optional: Profile picture URL
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
