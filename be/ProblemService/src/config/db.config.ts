import mongoose from "mongoose";
import logger from "./logger.config";

export const connectDB = async () => {
  try {
    const dbUrl = process.env.DB_URL || "";
    await mongoose.connect(dbUrl);

    logger.info(`Successfully connected to MongoDB`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn(`MongoDB connection lost`);
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info(`MongoDB connection closed`);
      process.exit(0);
    });

    
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error}`);
    process.exit(1);    // exit with failure
  }
};
