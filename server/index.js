const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Google OAuth Strategy Setup
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const googleSub = profile.id;
        const email = profile.emails?.[0]?.value;

        let user = await prisma.user.findUnique({
            where: { googleSub }
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    providerId: googleSub,
                    email,
                    name: profile.displayName,
                    picture: profile.photos?.[0]?.value
                }
            })
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

app.use(passport.initialize());

const authRouter = require("./routes/auth");
const taskRouter = require("./routes/task");

app.use("/auth", authRouter);
app.use("/task", taskRouter);

app.listen('4000', () => console.log('server running.'));