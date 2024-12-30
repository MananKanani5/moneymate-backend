const express = require("express");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();
const MongoConnect = require("./connection");
const passportConfig = require("./utils/passport");
const routes = require("./routes");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

MongoConnect();

app.use(
  cors({
    origin:
      "http://localhost:5173, https://moneymate-frontend-drab.vercel.app, https://moneymate.manankanani.in",
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_DB_URL,
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: false,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

app.use("/api", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
