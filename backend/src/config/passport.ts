import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../models/User.js";

export function configurePassport() {
    const clientID = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const callbackURL = (process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback").trim();

    if (!clientID || !clientSecret) {
        console.warn("⚠️ Google OAuth credentials missing in .env file. Google login will be disabled.");
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID,
                clientSecret,
                callbackURL,
            },
            async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
                try {
                    const googleId = profile.id;
                    const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase().trim() : null;
                    const name = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() || "Google User";
                    const photo = profile.photos && profile.photos[0] ? profile.photos[0].value : "";

                    if (!email) {
                        return done(new Error("No email returned from Google account"), undefined);
                    }

                    // 1. Check if user already exists by googleId
                    let user = await User.findOne({ googleId });

                    if (user) {
                        if (!user.photo && photo) {
                            user.photo = photo;
                            await user.save();
                        }
                        return done(null, user);
                    }

                    // 2. Check if user exists by email
                    user = await User.findOne({ email });

                    if (user) {
                        // Link googleId & set email verified since Google verified it
                        user.googleId = googleId;
                        user.isEmailVerified = true;
                        if (!user.photo && photo) {
                            user.photo = photo;
                        }
                        await user.save();
                        return done(null, user);
                    }

                    // 3. Otherwise, create new user with verified email
                    const randomPassword = crypto.randomBytes(16).toString("hex");
                    const hashedPassword = await bcrypt.hash(randomPassword, 10);

                    user = await User.create({
                        name,
                        fullName: name,
                        displayName: name,
                        photo,
                        email,
                        password: hashedPassword,
                        googleId,
                        isEmailVerified: true,
                        status: "ACTIVE",
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}

export default passport;
