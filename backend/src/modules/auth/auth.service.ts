import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../../models/User.js";
import VerificationToken from "../../models/VerificationToken.js";
import { generateToken } from "../../utils/jwt.js";
import { sendVerificationEmail } from "../../utils/mailer.js";

type RegisterUserInput = {
    name: string;
    email: string;
    password: string;
};

type LoginUserInput = {
    email: string;
    password: string;
};

export async function registerUser(data: RegisterUserInput) {
    const { name, email, password } = data;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return {
            success: false,
            message: "Email already exists",
        };
    }

    // 2. Hash plain-text password using bcrypt (salt rounds = 10)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Create user with hashed password
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        isEmailVerified: true,
    });

    // 4. Generate random crypto token for email verification
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await VerificationToken.create({
        userId: user._id,
        token: rawToken,
        expiresAt,
    });

    // 5. Send verification email (or log to console in dev mode)
    await sendVerificationEmail(user.email, rawToken);

    // 6. Exclude password hash from response object
    const userResponse = user.toObject();
    delete (userResponse as { password?: string }).password;

    return {
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        data: userResponse,
    };
}

export async function verifyEmailToken(token: string) {
    if (!token) {
        return {
            success: false,
            message: "Verification token is required",
        };
    }

    // 1. Find token document
    const tokenDoc = await VerificationToken.findOne({ token });

    if (!tokenDoc) {
        return {
            success: false,
            message: "Invalid or expired verification token",
        };
    }

    // 2. Update user's isEmailVerified status
    const user = await User.findById(tokenDoc.userId);

    if (!user) {
        return {
            success: false,
            message: "User associated with token not found",
        };
    }

    if (user.isEmailVerified) {
        // Cleanup token if user is already verified
        await VerificationToken.deleteOne({ _id: tokenDoc._id });
        return {
            success: true,
            message: "Email is already verified",
        };
    }

    user.isEmailVerified = true;
    await user.save();

    // 3. Delete used verification token
    await VerificationToken.deleteOne({ _id: tokenDoc._id });

    return {
        success: true,
        message: "Email verified successfully. You can now log in.",
    };
}

export async function resendVerificationToken(email: string) {
    const user = await User.findOne({ email });

    if (!user) {
        return {
            success: false,
            message: "User account with this email does not exist",
        };
    }

    if (user.isEmailVerified) {
        return {
            success: false,
            message: "Email is already verified. Please sign in.",
        };
    }

    // Delete any existing tokens for this user
    await VerificationToken.deleteMany({ userId: user._id });

    // Generate fresh 24-hour token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await VerificationToken.create({
        userId: user._id,
        token: rawToken,
        expiresAt,
    });

    await sendVerificationEmail(user.email, rawToken);

    return {
        success: true,
        message: "A new verification link has been sent to your email address.",
    };
}

export async function loginUser(data: LoginUserInput) {
    const { email, password } = data;

    // 1. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
        return {
            success: false,
            message: "Invalid email or password",
        };
    }

    // 2. Verify password match
    const isPasswordValid = await bcrypt.compare(password, user.password || "");

    if (!isPasswordValid) {
        return {
            success: false,
            message: "Invalid email or password",
        };
    }

    // 3. Auto-verify email if not already verified for seamless access
    if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
    }

    // 4. Generate JWT access token
    const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
    });

    // 5. Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as { password?: string }).password;

    return {
        success: true,
        message: "Login successful",
        token,
        data: userResponse,
    };
}

export async function getMe(userId: string) {
    const user = await User.findById(userId).select("-password");

    if (!user) {
        return {
            success: false,
            message: "User not found",
        };
    }

    return {
        success: true,
        data: user,
    };
}

export async function updateUserProfile(userId: string, data: Record<string, unknown>) {
    const user = await User.findById(userId);

    if (!user) {
        return {
            success: false,
            message: "User not found",
        };
    }

    // Explicitly prohibit updating email address
    if (data.email !== undefined && String(data.email).toLowerCase() !== user.email.toLowerCase()) {
        return {
            success: false,
            message: "Email address cannot be changed.",
        };
    }

    // 1. Track Name history if fullName or displayName changes
    const newFullName = data.fullName !== undefined ? String(data.fullName).trim() : undefined;
    const oldName = user.fullName || user.name;

    if (newFullName && newFullName !== oldName && oldName) {
        if (!user.previousNames) user.previousNames = [];
        user.previousNames.push({
            name: oldName,
            updatedAt: new Date(),
        });
    }

    // 2. Track Phone history if primary phone changes
    const newPhone = data.phone !== undefined ? String(data.phone).trim() : undefined;
    const oldPhone = user.phone;

    if (newPhone !== undefined && newPhone !== oldPhone && oldPhone) {
        if (!user.previousPhones) user.previousPhones = [];
        user.previousPhones.push({
            phone: oldPhone,
            updatedAt: new Date(),
        });
    }

    // List of allowed fields to update
    const allowedFields = [
        "fullName",
        "displayName",
        "photo",
        "gender",
        "dateOfBirth",
        "phone",
        "alternatePhone",
        "emergencyContact",
        "address",
        "country",
        "state",
        "city",
        "postalCode",
        "preferredLanguage",
        "theme",
        "timezone",
        "notificationPreferences",
        "securitySettings",
    ];

    allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
            (user as unknown as Record<string, unknown>)[field] = data[field];
        }
    });

    // Calculate Profile Completion %
    let filledCount = 0;
    const keyFields = [
        user.fullName || user.name,
        user.photo,
        user.gender && user.gender !== "PREFER_NOT_TO_SAY" ? user.gender : "",
        user.dateOfBirth,
        user.phone,
        user.address,
        user.city,
        user.country,
        user.emergencyContact?.phone,
        user.preferredLanguage,
    ];

    keyFields.forEach((val) => {
        if (val) filledCount++;
    });

    user.profileCompletionPercentage = Math.round((filledCount / keyFields.length) * 100);

    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as { password?: string }).password;

    return {
        success: true,
        message: "Profile updated successfully.",
        data: userResponse,
    };
}

export async function getBuildingTenants(userId: string, orgId?: string) {
    const user = await User.findById(userId);
    if (!user) {
        return { success: false, message: "User not found" };
    }

    const Customer = (await import("../../models/Customer.js")).default;
    const Membership = (await import("../../models/Membership.js")).default;

    // Find memberships for this user or query by orgId
    let queryOrgId = orgId;
    if (!queryOrgId) {
        const userMem = await Membership.findOne({ userId, status: "ACTIVE" });
        if (userMem) queryOrgId = userMem.organizationId.toString();
    }

    if (!queryOrgId) {
        return { success: true, data: [] };
    }

    const customers = await Customer.find({ organizationId: queryOrgId, status: "ACTIVE" })
        .populate("propertyId", "name code propertyType")
        .populate("unitId", "unitNumber floor status")
        .sort({ name: 1 })
        .exec();

    return {
        success: true,
        data: customers,
    };
}