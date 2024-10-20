const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session'); // Import express-session
require('dotenv').config();
// import yorkie from 'yorkie-js-sdk'
const yorkie = require('yorkie-js-sdk');
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

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
    console.log(profile);
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
        console.log(req.user.id);

        res.redirect('/profile');
    }
);

// Profile route (protected)
app.get('/profile', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
        //test
    // const client = new yorkie.Client('http://172.30.1.30:808');
    // await client.activate();
    
    // const doc = new yorkie.Document(`haha`);
    // await client.attach(doc, { initialPresence: {} });
    res.send(`Hello, ${req.user.displayName}!`);
});

// Logout route
app.get('/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(); // Destroy session after logout
        res.redirect('/');
    });
});


const mongooseOptions = {
    useNewUrlParser: true, // Use the new URL parser
    useUnifiedTopology: true, // Use the new server discovery and monitoring engine
    useCreateIndex: true, // Make Mongoose use createIndex() instead of ensureIndex()
    useFindAndModify: false, // Prevent the use of findAndModify()
};

mongoose.connect(mongoURI, mongooseOptions)
.then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
})
.catch(error => {
    console.error('MongoDB connection error:', error);
});
