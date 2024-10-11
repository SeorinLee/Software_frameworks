const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: { type: [String], default: [] },
  groups: { type: [String], default: [] },
  dob: { type: Date, required: true },
  imageUrl: { type: String },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
