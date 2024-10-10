import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import routes from './routes';

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
