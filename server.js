const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Match = require('./models/Match');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const SECRET_KEY = 'your_secret_key';  // Change this

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// MongoDB
mongoose.connect('mongodb://localhost:27017/football_league', { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware for auth
const auth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.redirect('/login');
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    res.redirect('/login');
  }
};

// Socket.io for live updates
io.on('connection', (socket) => {
  console.log('User connected');
  socket.on('updateMatch', async (matchId, event) => {
    const match = await Match.findById(matchId);
    match.events.push(event);
    if (event.type === 'goal') {
      if (event.team === match.team1) match.score1++;
      else match.score2++;
      // Update player stats
      const player = await Player.findById(event.player);
      player.goals++;
      await player.save();
    } // Add similar logic for assists, cards, etc.
    await match.save();
    io.emit('matchUpdate', match);
  });
});

// Routes
app.get('/', auth, async (req, res) => {
  const teams = await Team.find().populate('players').sort({ points: -1 });
  const matches = await Match.find().populate('team1 team2');
  res.render('index', { teams, matches });
});

app.get('/login', (req, res) => res.render('login'));

app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed, role });
  await user.save();
  res.redirect('/login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY);
    res.header('Authorization', token).redirect('/');
  } else {
    res.send('Invalid credentials');
  }
});

// Team Routes
app.post('/teams', auth, async (req, res) => {
  const { name, logo, colors } = req.body;
  const team = new Team({ name, logo, colors });
  await team.save();
  res.redirect('/');
});

app.get('/team/:id', auth, async (req, res) => {
  const team = await Team.findById(req.params.id).populate('players');
  res.render('team', { team });
});

app.post('/players', auth, async (req, res) => {
  const { name, teamId } = req.body;
  const player = new Player({ name, team: teamId });
  await player.save();
  const team = await Team.findById(teamId);
  team.players.push(player._id);
  await team.save();
  res.redirect(`/team/${teamId}`);
});

// Match Routes
app.post('/matches', auth, async (req, res) => {
  const { team1, team2 } = req.body;
  const match = new Match({ team1, team2 });
  await match.save();
  res.redirect('/');
});

app.get('/match/:id', auth, async (req, res) => {
  const match = await Match.findById(req.params.id).populate('team1 team2');
  res.render('match', { match });
});

app.post('/match/:id/event', auth, async (req, res) => {
  // Handle via Socket.io in frontend for live, but POST for non-live
  const { type, player, minute, detail } = req.body;
  const match = await Match.findById(req.params.id);
  match.events.push({ type, player, minute, detail });
  // Update scores/stats as in socket example
  await match.save();
  res.redirect(`/match/${req.params.id}`);
});

// Update standings after match finish
app.post('/match/:id/finish', auth, async (req, res) => {
  const match = await Match.findById(req.params.id);
  match.status = 'finished';
  const t1 = await Team.findById(match.team1);
  const t2 = await Team.findById(match.team2);
  t1.goalsFor += match.score1; t1.goalsAgainst += match.score2;
  t2.goalsFor += match.score2; t2.goalsAgainst += match.score1;
  if (match.score1 > match.score2) t1.points += 3;
  else if (match.score2 > match.score1) t2.points += 3;
  else { t1.points += 1; t2.points += 1; }
  await t1.save(); await t2.save(); await match.save();
  res.redirect('/');
});

server.listen(3000, () => console.log('Server on http://localhost:3000'));
