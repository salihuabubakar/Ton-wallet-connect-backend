import app from "./app.ts";
import { connectToDatabase } from "./lib/dbConnection.ts";

const port = process.env.PORT || 5001;

(async () => {
  try {
    await connectToDatabase();
    console.log("MongoDB connected");

    app.listen(port, () => {
      console.log(`Local server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
