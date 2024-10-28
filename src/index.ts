/// <reference path="./types/express.d.ts" />
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

// route
import index from './routes/index';
import category from './routes/category';
import user from './routes/user';
import admin from './routes/admin';
import books from './routes/books';
import publisher from './routes/publisher';

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // TODO: specify origin later (current: accept all origin)

// Routes
app.use('/categories', category);
app.use('/user', user);
app.use('/admin', admin);
app.use('/books', books);
app.use('/publisher', publisher);
app.use('/', index);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
