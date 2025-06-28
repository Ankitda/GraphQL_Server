import { app } from './app';
import dotenv from 'dotenv';
import connectMongoDb from "./config/mongoDB"

dotenv.config();

const PORT = process.env.PORT || 3000;

connectMongoDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
})
