const express = require("express");
const router = express.Router();
const passport = require("passport");
const { User, Expense } = require("./models/users.js");
const dashboardService = require("./services/dashboardService.js");
const expensesService = require("./services/expenseService.js");
const moment = require("moment-timezone");

// Middleware to Ensure Authentication
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res
    .status(401)
    .json({ authenticated: false, message: "Unauthorized Access" });
};

// Routes
router.get("/", (req, res) => {
  res.status(200).json({ message: "Backend API" });
});

// Registration Route
router.post("/register", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Registration successful!",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Registration Failed",
      error: err.message,
    });
  }
});

// Login Route
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name,
    },
  });
});

// Logout Route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
        error: err.message,
      });
    }
    res.clearCookie("connect.sid", {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to destroy session",
          error: err.message,
        });
      }
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    });
  });
});

// Check Authentication Route
router.get("/authenticated", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        name: req.user.name,
      },
    });
  } else {
    res.status(200).json({ authenticated: false });
  }
});

// Dashboard Route
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    const totalSpentAmount = await dashboardService.getTotalSpentInCurrentMonth(
      req.user._id
    );
    const lastThreeTransactions =
      await dashboardService.getLastThreeTransactions(req.user._id);
    const expensesByCategory = await dashboardService.getExpensesByCategory(
      req.user._id
    );
    const weeklyExpenses = await dashboardService.getWeeklyExpenses(
      req.user._id
    );

    const dashboardData = {
      user: { id: req.user.id, username: req.user.username },
      totalSpentAmount,
      lastThreeTransactions,
      expensesByCategory,
      weeklyExpenses,
    };

    res.status(200).json(dashboardData);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error fetching dashboard data", error: err.message });
  }
});

// Add Expense Route
router.post("/expenses", ensureAuthenticated, async (req, res) => {
  const { time, date, amount, category, note } = req.body;
  const datetime = moment.tz(`${date}T${time}`, "Asia/Kolkata").toDate();
  const expenseData = {
    datetime,
    amount,
    category,
    note,
    user: req.user.id,
  };

  try {
    const newExpense = new Expense(expenseData);
    await newExpense.save();
    res
      .status(201)
      .json({ success: true, message: "Expense added successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error adding expense",
      error: err.message,
    });
  }
});

router.get("/expenses", ensureAuthenticated, async (req, res) => {
  const { month } = req.query;
  const currentDate = new Date();
  let selectedYear, selectedMonth;

  if (month) {
    [selectedYear, selectedMonth] = month.split("-").map(Number);
  } else {
    selectedYear = currentDate.getFullYear();
    selectedMonth = currentDate.getMonth() + 1;
  }

  try {
    const expenses = await expensesService.getMonthlyExpenses(
      req.user._id,
      selectedMonth,
      selectedYear
    );
    const totalSpent = await expensesService.calculateTotalSpent(
      req.user._id,
      selectedMonth,
      selectedYear
    );

    const expensesData = {
      expenses,
      totalSpent,
      selectedMonth,
      selectedYear,
    };

    res.json(expensesData);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching expenses data." });
  }
});

// router.patch("/expenses/:id", async (req, res) => {
//   const { id } = req.params;
//   const { time, date, amount, category, note } = req.body;
//   const datetime = new Date(`${date}T${time}`);
//   const expenseData = {
//     datetime,
//     amount,
//     category,
//     note,
//     user: req.user.id,
//   };
//   try {
//     await Expense.findByIdAndUpdate(id, expenseData, { new: true });
//     invalidateCache(req.user._id);
//     req.flash("success_msg", "Expense Updated Successfully");
//     res.redirect("/expenses?refresh=true");
//   } catch (err) {
//     req.flash("error_msg", "Error updating the expense.");
//     res.status(500).redirect("/dashboard?refresh=true");
//   }
// });

// router.delete("/expenses/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     await Expense.findByIdAndDelete(id);
//     invalidateCache(req.user._id);
//     req.flash("success_msg", "Expense Deleted Successfully");
//     res.redirect("/expenses?refresh=true");
//   } catch (error) {
//     req.flash("error_msg", "Error Deleting the expense.");
//     res.status(500).redirect("/dashboard?refresh=true");
//   }
// });

module.exports = router;
