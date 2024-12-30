const { Expense } = require("../models/users");
const moment = require("moment-timezone");

const formatDate = (date) => {
  const formattedDate = moment(date)
    .tz("Asia/Kolkata")
    .format("hh:mm A DD/MM/YY");
  return formattedDate;
};

const getTotalSpentInCurrentMonth = async (userId) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalSpent = await Expense.aggregate([
    {
      $match: {
        user: userId,
        datetime: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1),
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

  return totalSpent.length > 0 ? totalSpent[0].totalAmount : 0;
};

const getLastThreeTransactions = async (userId) => {
  const transactions = await Expense.find({ user: userId })
    .sort({ datetime: -1 })
    .limit(3);

  return transactions.map((transaction) => ({
    ...transaction.toObject(),
    datetime: formatDate(transaction.datetime),
  }));
};

const getExpensesByCategory = async (userId) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return await Expense.aggregate([
    {
      $match: {
        user: userId,
        datetime: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    },
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);
};

const getWeeklyExpenses = async (userId) => {
  const today = moment().tz("Asia/Kolkata");
  const startOfWeek = today.clone().startOf("isoWeek").toDate();
  const endOfWeek = today.clone().endOf("isoWeek").toDate();

  const weeklyData = await Expense.aggregate([
    {
      $match: {
        user: userId,
        datetime: {
          $gte: startOfWeek,
          $lte: endOfWeek,
        },
      },
    },
    {
      $project: {
        _id: 1,
        datetime: 1,
        dayOfWeek: {
          $dayOfWeek: { date: "$datetime", timezone: "Asia/Kolkata" },
        },
        amount: 1,
      },
    },
    {
      $group: {
        _id: "$dayOfWeek",
        totalAmount: { $sum: "$amount" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const formattedData = dayLabels.map((day, index) => {
    const expenseData = weeklyData.find(
      (item) => item._id === (index + 2) % 7 || (index === 6 && item._id === 1)
    );

    return {
      _id: day,
      totalAmount: expenseData ? expenseData.totalAmount : 0,
    };
  });

  return formattedData;
};

module.exports = {
  getTotalSpentInCurrentMonth,
  getLastThreeTransactions,
  getExpensesByCategory,
  getWeeklyExpenses,
};
