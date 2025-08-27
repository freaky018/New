const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: String,
  password: String,  // Hashed
  role: String  // e.g., "organizer", "player", "fan"
});
module.exports = mongoose.model('User', userSchema);
