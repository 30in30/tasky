const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const router = express.Router();
const { PrismaClient } = require('@prisma/client')
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.get('/google',
    passport.authenticate('google', {scope: ['profile', 'email']})
);

// Callback
app.get('/auth/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        const user = req.user;
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });

        // httponly cookify
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 360000
        })
        // Redirect
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    }
)

// Fetch user
app.get('api/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = req.cookies.token || authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) return res.status(404).json({ error: 'User not found'});

        return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture
        });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;