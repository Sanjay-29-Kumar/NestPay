import bcrypt from "bcrypt";
import User from "../../models/User.js";

type RegisterUserInput = {
    name: string;
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
    });

    // 4. Exclude password hash from response object
    const userResponse = user.toObject();
    delete (userResponse as { password?: string }).password;

    return {
        success: true,
        message: "User registered successfully",
        data: userResponse,
    };
}