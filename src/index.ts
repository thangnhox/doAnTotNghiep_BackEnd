import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';

// route
import index from './routes/index';
import category from './routes/category';

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/', index);
app.use('/categories', category);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
