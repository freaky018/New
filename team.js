const mongoose = require('mongoose');
const teamSchema = new mongoose.Schema({
  name: String,
  logo: String,  // URL or path to logo
  colors: String,  // e.g., "red,white"
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  points: { type: Number, default: 0 },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 }
});
module.exports = mongoose.model('Team', teamSchema);
