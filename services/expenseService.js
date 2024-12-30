const { Expense } = require("../models/users.js");
const moment = require("moment-timezone");

const formatDate = (date) => {
  const formattedDate = moment(date)
    .tz("Asia/Kolkata")
    .format("hh:mm A DD/MM/YY");
  return formattedDate;
};

const getMonthlyExpenses = async (
  userId,
  month,
  year,
  page = 1,
  limit = 20
) => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);

  const expenses = await Expense.find({
    user: userId,
    datetime: {
      $gte: startOfMonth,
      $lt: endOfMonth,
    },
  })
    .sort({ datetime: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return expenses.map((expense) => ({
    ...expense.toObject(),
    datetime: formatDate(expense.datetime),
  }));
};

const calculateTotalSpent = async (userId, month, year) => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);

  const total = await Expense.aggregate([
    {
      $match: {
        user: userId,
        datetime: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  return total[0] ? total[0].totalAmount : 0;
};

module.exports = {
  getMonthlyExpenses,
  calculateTotalSpent,
};
