const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session'); // Import express-session
require('dotenv').config();

const app = express();

app.use(session({
    secret: process.env.COOKIE_SECRET, // Secret key from your .env file
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    console.log(profile)
    return done(null, profile); // Pass user profile to done callback
}));

// Routes
app.get('/', (req, res) => {
    res.send('<a href="/auth/google">Login with Google</a>');
});

// Google OAuth login route
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google OAuth callback route
app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication
        res.redirect('/profile');
    }
);

// Profile route (protected)
app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    // If the user is authenticated, show profile info
    res.send(`Hello, ${req.user.displayName}!`);
});

// Logout route
app.get('/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(); // Destroy session after logout
        res.redirect('/');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
