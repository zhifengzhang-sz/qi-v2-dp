#!/usr/bin/env bun

/**
 * QiCore Crypto Data Platform - Demo Launcher
 *
 * Interactive launcher for all demo programs.
 * Choose which demo to run from a simple menu.
 */

import { execSync } from "child_process";

interface Demo {
  name: string;
  file: string;
  description: string;
  category: "sources" | "targets" | "pipeline" | "services" | "legacy";
  difficulty: "basic" | "advanced" | "architecture";
}

const demos: Demo[] = [
  // Source Actor Demos
  {
    name: "CoinGecko Source Demo",
    file: "sources/coingecko-source-demo.ts",
    description: "CoinGecko Market Data Reader - API data acquisition with unified DSL",
    category: "sources",
    difficulty: "basic",
  },
  {
    name: "Redpanda Source Demo",
    file: "sources/redpanda-source-demo.ts", 
    description: "Redpanda Market Data Reader - Stream consumption with unified DSL",
    category: "sources",
    difficulty: "basic",
  },
  
  // Target Actor Demos
  {
    name: "Redpanda Target Demo",
    file: "targets/redpanda-target-demo.ts",
    description: "Redpanda Market Data Writer - Stream publishing with unified DSL",
    category: "targets", 
    difficulty: "basic",
  },
  {
    name: "TimescaleDB Target Demo",
    file: "targets/timescale-target-demo.ts",
    description: "TimescaleDB Market Data Writer - Time-series storage with unified DSL",
    category: "targets",
    difficulty: "basic", 
  },

  // End-to-End Pipeline Demo
  {
    name: "End-to-End Pipeline Demo",
    file: "end-to-end-pipeline-demo.ts",
    description: "Complete data pipeline: CoinGecko → Redpanda → TimescaleDB",
    category: "pipeline",
    difficulty: "advanced",
  },

  // Infrastructure Demos
  {
    name: "Docker Services Demo",
    file: "services/docker-services-demo.ts",
    description: "Infrastructure management and service health checks",
    category: "services",
    difficulty: "basic",
  },

  // Legacy Demos (for reference)
  {
    name: "Simple Crypto Data Demo (Legacy)",
    file: "publishers/simple-crypto-data-demo.ts",
    description: "Basic CoinGecko Actor with real cryptocurrency data",
    category: "legacy",
    difficulty: "basic",
  },
  {
    name: "Advanced Financial DSL Demo (Legacy)",
    file: "publishers/advanced-crypto-demo.ts",
    description: "Comprehensive financial analysis with all 5 DSL functions",
    category: "legacy",
    difficulty: "advanced",
  },
  {
    name: "Architecture Validation Demo (Legacy)",
    file: "publishers/demo-architecture-simple.ts",
    description: "TRUE Actor pattern and factor-compositional architecture",
    category: "legacy",
    difficulty: "architecture",
  },
];

function displayMenu() {
  console.log("🚀 QICORE CRYPTO DATA PLATFORM - DEMO LAUNCHER");
  console.log("=".repeat(60));
  console.log("📊 Choose a demo to run:\n");

  // Group demos by category
  const categories = ["sources", "targets", "pipeline", "services", "legacy"];
  const categoryEmojis = {
    sources: "📡",
    targets: "🎯", 
    pipeline: "🌊",
    services: "🐳",
    legacy: "📦"
  };
  const categoryNames = {
    sources: "DATA SOURCES",
    targets: "DATA TARGETS",
    pipeline: "END-TO-END PIPELINE", 
    services: "INFRASTRUCTURE",
    legacy: "LEGACY DEMOS"
  };

  categories.forEach(category => {
    const categoryDemos = demos.filter(demo => demo.category === category);
    if (categoryDemos.length > 0) {
      console.log(`${categoryEmojis[category]} ${categoryNames[category]}:`);
      
      categoryDemos.forEach((demo, index) => {
        const demoIndex = demos.indexOf(demo) + 1;
        const difficulty = demo.difficulty === "basic" ? "🟢" : demo.difficulty === "advanced" ? "🟡" : "🔵";

        console.log(`   ${demoIndex}. ${demo.name} ${difficulty}`);
        console.log(`      📝 ${demo.description}`);
        console.log("");
      });
    }
  });

  console.log("   ❌ 0. Exit");
  console.log("\n" + "=".repeat(60));
}

function runDemo(demoIndex: number): boolean {
  if (demoIndex === 0) {
    console.log("👋 Goodbye!");
    return false;
  }

  if (demoIndex < 1 || demoIndex > demos.length) {
    console.log("❌ Invalid selection. Please try again.\n");
    return true;
  }

  const demo = demos[demoIndex - 1];

  console.log("🚀 LAUNCHING DEMO");
  console.log("=".repeat(40));
  console.log(`📊 Demo: ${demo.name}`);
  console.log(`📝 Description: ${demo.description}`);
  console.log(`📁 File: app/demos/${demo.file}`);
  console.log("=".repeat(40));
  console.log("");

  try {
    execSync(`bun app/demos/${demo.file}`, { stdio: "inherit" });

    console.log("\n" + "=".repeat(40));
    console.log("✅ Demo completed successfully!");
    console.log("=".repeat(40));
  } catch (error) {
    console.log("\n" + "=".repeat(40));
    console.log("❌ Demo failed or was interrupted");
    console.log("=".repeat(40));
  }

  console.log("\nPress Enter to return to menu...");

  // Wait for user input
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("", () => {
      rl.close();
      resolve(true);
    });
  });
}

async function main() {
  let running = true;

  console.log("\n🎭 Welcome to the QiCore Crypto Data Platform Demo Launcher!");
  console.log("💡 All demos use real cryptocurrency data from CoinGecko.\n");

  while (running) {
    displayMenu();

    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const choice = await new Promise<string>((resolve) => {
      rl.question("Enter your choice (0-4): ", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    console.log("");

    const demoIndex = Number.parseInt(choice);
    if (isNaN(demoIndex)) {
      console.log("❌ Please enter a valid number.\n");
      continue;
    }

    running = await runDemo(demoIndex);
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Demo launcher interrupted. Goodbye!");
  process.exit(0);
});

if (import.meta.main) {
  main().catch((error) => {
    console.error("❌ Demo launcher error:", error);
    process.exit(1);
  });
}
