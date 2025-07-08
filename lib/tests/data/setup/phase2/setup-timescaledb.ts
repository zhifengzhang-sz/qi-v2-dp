#!/usr/bin/env bun

/**
 * TimescaleDB Test Database Setup
 * 
 * Creates the test database and required tables for integration testing.
 * This is part of Phase 2 service validation.
 */

import { Client } from "pg";

export async function setupTimescaleDB(): Promise<{ success: boolean; error?: string }> {
  console.log("🗄️ Setting up TimescaleDB test database...");
  
  try {
    // First connect to postgres database to create the test database
    const adminClient = new Client({
      host: "localhost",
      port: 5432,
      database: "postgres", // Default database
      user: "postgres",
      password: "password",
    });

    await adminClient.connect();
    
    // Create test database if it doesn't exist
    try {
      await adminClient.query(`CREATE DATABASE crypto_data_test;`);
      console.log("✅ Created crypto_data_test database");
    } catch (dbError) {
      const error = dbError as Error;
      if (error.message.includes("already exists")) {
        console.log("ℹ️ Database crypto_data_test already exists");
      } else {
        throw dbError;
      }
    }
    
    await adminClient.end();
    
    // Connect to the test database to set up TimescaleDB and tables
    const testClient = new Client({
      host: "localhost",
      port: 5432,
      database: "crypto_data_test",
      user: "postgres",
      password: "password",
    });

    await testClient.connect();
    
    // Enable TimescaleDB extension
    try {
      await testClient.query(`CREATE EXTENSION IF NOT EXISTS timescaledb;`);
      console.log("✅ TimescaleDB extension enabled");
    } catch (extError) {
      console.log("⚠️ TimescaleDB extension not available - using regular PostgreSQL");
    }
    
    // Create crypto_prices table
    await testClient.query(`
      CREATE TABLE IF NOT EXISTS crypto_prices (
        id SERIAL PRIMARY KEY,
        coin_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        usd_price DECIMAL(20,8) NOT NULL,
        market_cap_usd BIGINT,
        volume_24h_usd BIGINT,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        source TEXT NOT NULL,
        attribution TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Created crypto_prices table");
    
    // Create crypto_ohlcv table
    await testClient.query(`
      CREATE TABLE IF NOT EXISTS crypto_ohlcv (
        id SERIAL PRIMARY KEY,
        coin_id TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        open_price DECIMAL(20,8) NOT NULL,
        high_price DECIMAL(20,8) NOT NULL,
        low_price DECIMAL(20,8) NOT NULL,
        close_price DECIMAL(20,8) NOT NULL,
        volume DECIMAL(30,8),
        source TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Created crypto_ohlcv table");
    
    // Create market_analytics table
    await testClient.query(`
      CREATE TABLE IF NOT EXISTS market_analytics (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        total_market_cap BIGINT NOT NULL,
        total_volume BIGINT NOT NULL,
        btc_dominance DECIMAL(5,2) NOT NULL,
        eth_dominance DECIMAL(5,2) NOT NULL,
        market_cap_change_24h DECIMAL(5,2),
        volume_change_24h DECIMAL(5,2),
        active_cryptocurrencies INTEGER,
        markets INTEGER,
        source TEXT NOT NULL,
        attribution TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Created market_analytics table");
    
    // Try to create hypertables if TimescaleDB is available
    try {
      await testClient.query(`SELECT create_hypertable('crypto_prices', 'timestamp', if_not_exists => TRUE);`);
      console.log("✅ crypto_prices converted to hypertable");
      
      await testClient.query(`SELECT create_hypertable('crypto_ohlcv', 'timestamp', if_not_exists => TRUE);`);
      console.log("✅ crypto_ohlcv converted to hypertable");
      
      await testClient.query(`SELECT create_hypertable('market_analytics', 'timestamp', if_not_exists => TRUE);`);
      console.log("✅ market_analytics converted to hypertable");
    } catch (hypertableError) {
      console.log("ℹ️ Hypertables not created - TimescaleDB not available or tables already exist");
    }
    
    // Create indexes for better performance
    await testClient.query(`CREATE INDEX IF NOT EXISTS idx_crypto_prices_coin_timestamp ON crypto_prices(coin_id, timestamp);`);
    await testClient.query(`CREATE INDEX IF NOT EXISTS idx_crypto_ohlcv_coin_timestamp ON crypto_ohlcv(coin_id, timestamp);`);
    await testClient.query(`CREATE INDEX IF NOT EXISTS idx_market_analytics_timestamp ON market_analytics(timestamp);`);
    console.log("✅ Created performance indexes");
    
    // Insert some test data from fixtures
    await insertTestData(testClient);
    
    await testClient.end();
    console.log("🎉 TimescaleDB test database setup complete");
    
    return { success: true };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ TimescaleDB setup failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

async function insertTestData(client: Client): Promise<void> {
  try {
    // Insert Bitcoin price data from fixtures
    const bitcoinPrice = 108875; // From real CoinGecko data
    await client.query(`
      INSERT INTO crypto_prices (coin_id, symbol, usd_price, market_cap_usd, volume_24h_usd, source, attribution)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `, ["bitcoin", "BTC", bitcoinPrice, 2165325711806, 25405572930, "test-setup", "Integration Test Setup"]);
    
    await client.query(`
      INSERT INTO crypto_prices (coin_id, symbol, usd_price, market_cap_usd, volume_24h_usd, source, attribution)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING  
    `, ["ethereum", "ETH", 3100, 373000000000, 15000000000, "test-setup", "Integration Test Setup"]);
    
    // Insert market analytics
    await client.query(`
      INSERT INTO market_analytics (timestamp, total_market_cap, total_volume, btc_dominance, eth_dominance, source, attribution)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
    `, [new Date(), 2500000000000, 50000000000, 45.5, 18.2, "test-setup", "Integration Test Setup"]);
    
    console.log("✅ Inserted test data for integration testing");
    
  } catch (insertError) {
    console.log("⚠️ Test data insertion failed - continuing without seed data");
  }
}

// CLI execution
if (import.meta.main) {
  const result = await setupTimescaleDB();
  
  if (!result.success) {
    console.error("❌ TimescaleDB setup failed");
    process.exit(1);
  }
  
  console.log("🎉 TimescaleDB ready for testing");
  process.exit(0);
}