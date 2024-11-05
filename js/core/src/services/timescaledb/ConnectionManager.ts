/**
 * @module db/connection
 * @description Timescaledb Database connection manager implementing the singleton pattern
 */

import { Sequelize } from 'sequelize';
import { logger } from '@qi/core/logger';
import { ConfigHandler } from '@qi/core/config';
import { initInstrument, initMarket, initOHLCV, initTick } from './models/cryptocompare/index.js';
import { ServiceConfig } from '../schemas/ServiceSchema.js'; // Adjust path as needed

/**
 * @class TSDBConnection
 * @description Manages database connections and model initialization
 * 
 * @example
 * const db = TSDBConnection.getInstance();
 * await db.initialize();
 * // Use db.getSequelize() to access Sequelize instance
 * await db.close();
 */
export class TSDBConnection {
  /** Singleton instance */
  private static instance: TSDBConnection;
  /** Sequelize instance */
  private sequelize!: Sequelize;
  /** Initialization state */
  private initialized: boolean = false;

  /**
   * Private constructor to enforce singleton pattern
   * Initializes Sequelize with configuration
   */
  private constructor() {
    // Fetch the service configuration using ConfigHandler
    const serviceConfig = ConfigHandler.getInstance<ServiceConfig>("service").getConfig();

    const dbConfig = serviceConfig.database;

    this.sequelize = new Sequelize({
      dialect: "postgres",
      host: dbConfig.dbHost,
      port: dbConfig.dbPort,
      database: dbConfig.dbName,
      username: dbConfig.dbUser,
      password: dbConfig.dbPassword,
      logging: false,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
      },
    });
  }

  /**
   * Gets the singleton instance of TSDBConnection
   * @returns TSDBConnection instance
   */
  public static getInstance(): TSDBConnection {
    if (!TSDBConnection.instance) {
      TSDBConnection.instance = new TSDBConnection();
    }
    return TSDBConnection.instance;
  }

  /**
   * Initializes the database connection and models
   * @throws Will throw an error if connection or model initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn("Database already initialized");
      return;
    }

    try {
      await this.sequelize.authenticate();
      logger.info("Database connection established successfully");

      this.initializeModels();

      await this.sequelize.sync();
      logger.info("Database models synchronized");

      this.initialized = true;
    } catch (error) {
      logger.error("Unable to connect to the database:", error);
      throw error;
    }
  }

  /**
   * Initializes all database models and their relationships
   * @private
   */
  private initializeModels(): void {
    // Initialize individual models
    initMarket(this.sequelize);
    initInstrument(this.sequelize);
    initOHLCV(this.sequelize);
    initTick(this.sequelize);

    // Get model references
    const { Market, Instrument, OHLCV, Tick } = this.sequelize.models;

    // Set up associations
    Market.hasMany(Instrument);
    Instrument.belongsTo(Market);

    Instrument.hasMany(OHLCV);
    OHLCV.belongsTo(Instrument);

    Instrument.hasMany(Tick);
    Tick.belongsTo(Instrument);
  }

  /**
   * Gets the Sequelize instance
   * @returns The Sequelize instance
   */
  public getSequelize(): Sequelize {
    return this.sequelize;
  }

  /**
   * Closes the database connection
   * @throws Will throw an error if closing the connection fails
   */
  public async close(): Promise<void> {
    try {
      await this.sequelize.close();
      logger.info("Database connection closed");
      this.initialized = false;
    } catch (error) {
      logger.error("Error closing database connection:", error);
      throw error;
    }
  }
}
