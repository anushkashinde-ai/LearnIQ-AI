import mongoose from "mongoose";

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_LOCAL_URI || "mongodb://127.0.0.1:27017/ai-learning";

  const tryConnect = async (uri, label) => {
    if (!uri) throw new Error(`${label} URI missing`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
    });
    console.log(`MongoDB Connected (${label}): ${conn.connection.host}`);
    return conn;
  };

  try {
    return await tryConnect(primaryUri, "Atlas/primary");
  } catch (primaryErr) {
    console.warn(`MongoDB primary (Atlas) connection failed: ${primaryErr.message}`);
    console.warn(`Falling back to local MongoDB (${fallbackUri})...`);
    try {
      return await tryConnect(fallbackUri, "local/fallback");
    } catch (fallbackErr) {
      console.error("MongoDB primary + fallback both failed.");
      console.error("Primary error:", primaryErr.message);
      console.error("Fallback error:", fallbackErr.message);
      process.exit(1);
    }
  }
};

export default connectDB;