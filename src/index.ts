/// <reference path="./types/express.d.ts" />

console.time("Start server");

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import Logger from './util/logger';

dotenv.config();

// Logger
Logger.init(process.env.SERVER_LOG_PATH || 'Server.log');


// route
import index from './routes/index';
import category from './routes/category';
import user from './routes/user';
import admin from './routes/admin';
import books from './routes/books';
import publisher from './routes/publisher';
import { AppDataSource } from './models/repository/Datasource';
import authors from './routes/authors';
import PDFCache from './services/pdfcacher';
import orders from './routes/orders';
import membership from './routes/membership';
import discount from './routes/discount';
import { initCron } from './services/cron';
import tags from './routes/tags';
import notes from './routes/notes';

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
app.use('/authors', authors);
app.use('/order', orders);
app.use('/membership', membership);
app.use('/discount', discount);
app.use('/tags', tags);
app.use('/notes', notes);
app.use('/', index);

// Cron
initCron();

console.timeEnd("Start server");
const server = app.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
  PDFCache.setup(524288000, './.cache');
  await AppDataSource.getInstance();
});

['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, async () => {
      console.log(`${signal} signal received. Closing server.`);
      server.close(async () => {
          await AppDataSource.shutdown();
          console.log('Database connection closed.');
          process.exit(0);
      });
  });
}); 

process.once('SIGUSR2', async () => {
  console.log('SIGUSR2 signal received. Restarting server.');
  server.close(async () => {
      await AppDataSource.shutdown();
      console.log('Database connection closed.');
      process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('exit', async (code) => {
  console.log(`Process exiting with code: ${code}`);
  await AppDataSource.shutdown();
  console.log('Database connection closed.');
});
