import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import router from './routes';

export const app = express();

app.use(express.json());

// Routes
app.use('/api',router);

// Error handler
app.use(errorHandler);
