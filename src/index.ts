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
import { AppDataSource } from './models/repository/Datasource';

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

const server = app.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
  await AppDataSource.getInstace();
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
