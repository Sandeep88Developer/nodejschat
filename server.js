const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const User = require('./models/User');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Passport Config
require('./config/passport')(passport);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chat-app', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Express session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    res.locals.user = req.user || null;
    next();
});

// EJS setup
app.set('view engine', 'ejs');

// Routes
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        req.flash('success', 'You are registered, please log in.');
        res.redirect('/login');
    } catch (err) {
        req.flash('error', 'Registration failed.');
        res.redirect('/register');
    }
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/chat',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

app.get('/chat', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    res.render('chat');
});

app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'You are logged out');
    res.redirect('/login');
});

// Socket.io connection
io.on('connection', socket => {
    console.log('New WebSocket connection...');

    socket.on('chatMessage', msg => {
        io.emit('message', msg);
    });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
