import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

// route
import index from './routes/index';
import category from './routes/category';
import user from './routes/user';

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/categories', category);
app.use('/user', user);
app.use('/', index);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
