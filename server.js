const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session'); 
require('dotenv').config();
// import yorkie from 'yorkie-js-sdk'
const yorkie = require('yorkie-js-sdk');
const mongoose = require('mongoose');

const { create_group, get_groups, create_document, get_documents, add_user_to_group, generate_token} = require('./controllers/group_controller');

const mongoURI = process.env.MONGO_URI;
const PORT = process.env.PORT

const app = express();
app.use(express.json());
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
    // console.log(profile);
    return done(null, profile); // Pass user profile to done callback
}));

// Routes
app.get('/', (req, res) => {
    res.send('<a href="/backend/auth/google">Login with Google</a>');
});

// Google OAuth login route
app.get('/auth/google', (req, res, next) => {
    const nextUrl = req.query.next || '/'; // Default to '/profile' if no next URL is provided
    const state = JSON.stringify({ next: nextUrl }); // Store `next` in `state`

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state, 
    })(req, res, next);
});


// Google OAuth callback route
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Decode the `state` parameter to retrieve `next` URL
        const state = req.query.state ? JSON.parse(req.query.state) : {};
        const nextUrl = state.next || '/'; 

        // Redirect the user to the `next` URL
        res.redirect(nextUrl);
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

app.get('/api/groups', get_groups);
app.post('/api/groups', create_group);

app.post('/api/groups/:group_name/documents', create_document);
app.get('/api/groups/:group_name/documents', get_documents);

app.post('/api/groups/:group_name/invite',generate_token);
app.get('/api/groups/invite/:token',add_user_to_group);

const mongooseOptions = {
    useNewUrlParser: true, // Use the new URL parser
    useUnifiedTopology: true, // Use the new server discovery and monitoring engine
    // useCreateIndex: true,  Make Mongoose use createIndex() instead of ensureIndex()
    // useFindAndModify: false,  Prevent the use of findAndModify()
};

console.log(mongoURI);
mongoose.connect(mongoURI, mongooseOptions)
.then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
})
.catch(error => {
    console.error('MongoDB connection error:', error);
});
