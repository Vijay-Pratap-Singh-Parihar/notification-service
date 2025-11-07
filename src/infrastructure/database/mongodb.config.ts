import mongoose from 'mongoose';
import { Logger } from '../../shared/logging/logger';

export class MongoDBConfig {
  private static instance: MongoDBConfig;
  private connectionString: string;

  private constructor() {
    this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/notification-service';
  }

  public static getInstance(): MongoDBConfig {
    if (!MongoDBConfig.instance) {
      MongoDBConfig.instance = new MongoDBConfig();
    }
    return MongoDBConfig.instance;
  }

  public async connect(): Promise<void> {
    try {
      const dbName = process.env.MONGODB_DB_NAME || 'notification-service';
      const mongoUri = process.env.MONGODB_URI;

      if (!mongoUri) {
        throw new Error('MONGODB_URI is not set');
      }

      const connection = await mongoose.connect(`${mongoUri}/${dbName}`, {
        serverSelectionTimeoutMS: 5000,
      });

      Logger.info(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
    } catch (error) {
      Logger.error('MongoDB connection error', undefined, { error: String(error) });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      Logger.info('MongoDB disconnected');
    } catch (error) {
      Logger.error('MongoDB disconnection error', undefined, { error: String(error) });
      throw error;
    }
  }

  public getConnectionString(): string {
    return this.connectionString;
  }
}

