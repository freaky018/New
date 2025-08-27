const mongoose = require('mongoose');
const matchSchema = new mongoose.Schema({
  team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  score1: { type: Number, default: 0 },
  score2: { type: Number, default: 0 },
  events: [{
    type: String,  // e.g., "goal", "yellow", "red", "substitution"
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    minute: Number,
    detail: String  // e.g., "assist by X" or "sub in Y"
  }],
  status: { type: String, default: 'scheduled' }  // scheduled, live, finished
});
module.exports = mongoose.model('Match', matchSchema);
