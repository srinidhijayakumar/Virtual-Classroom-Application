const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail", // Or use Mailtrap for testing
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// @desc Register User
// @route POST /api/v1/auth/register
exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!["student", "teacher", "product owner", "parent"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const newUser = await User.create({ username, email, password, role });

        // Send email verification
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        const url = `${process.env.BASE_URL}/api/v1/auth/verify-email/${token}`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Email",
            html: `<h3>Click the link to verify:</h3> <a href="${url}">${url}</a>`,
        });

        res.status(201).json({ message: "User registered. Please verify your email." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// @desc Verify Email
// @route GET /api/v1/auth/verify-email/:token
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        await User.findOneAndUpdate({ email: decoded.email }, { isVerified: true });
        res.json({ message: "Email verified successfully" });
    } catch (error) {
        res.status(400).json({ message: "Invalid or expired token" });
    }
};

// @desc Login User
// @route POST /api/v1/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        if (!user.isVerified) return res.status(400).json({ message: "Please verify your email first" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, user: { username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
