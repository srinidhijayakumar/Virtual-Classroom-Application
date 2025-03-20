const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Changed from 'username' to 'name'
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rollno: { type: String, required: true, unique: true },
    class: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    role: { 
        type: String, 
        enum: ["student", "teacher", "product owner", "parent"], 
        required: true 
    },
    isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", UserSchema);


// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model("User", UserSchema);