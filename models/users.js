const { Schema, mongoose } = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const expenseSchema = new mongoose.Schema({
  datetime: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  category: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: "",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

expenseSchema.index({ user: 1, datetime: 1 });

const User = mongoose.model("User", userSchema);
const Expense = mongoose.model("Expense", expenseSchema);

module.exports = { User, Expense };
