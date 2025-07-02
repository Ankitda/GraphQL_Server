import dotenv from "dotenv";
import connectMongoDb from "./config/mongoDB";
import apolloServer from "./graphQl/config/graphQl";
import app from "./app";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

async function startServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app: app as unknown as any,
    path: "/graphql",
  });

  const PORT = process.env.PORT || 3000;

  connectMongoDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

startServer();

// Error Handler
app.use(errorHandler);
