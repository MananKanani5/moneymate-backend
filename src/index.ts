import express from 'express';
import cors from "cors";
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';
import 'dotenv/config';
import passport from 'passport';
import { passportConfig } from './passport';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(
  {
    origin: process.env.CLIENT_URL,
  }
));

app.use('/public', express.static('public'));

passportConfig(passport);
app.use(passport.initialize());

app.use('/api', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});