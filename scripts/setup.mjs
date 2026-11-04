import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const backendDir = path.resolve(rootDir, "../SCSK-Backend");

console.log("=== Soroban Clear-Sign Kit (SCSK) Quick Setup ===");

// 1. Ensure SCSK-Backend exists
if (!fs.existsSync(backendDir)) {
  console.log(
    "Cloning SCSK-Backend (@clearsign/core) into sibling directory...",
  );
  execSync(
    "git clone --depth 1 https://github.com/Soroban-Clear-Sign-Kit/SCSK-Backend.git ../SCSK-Backend",
    { cwd: rootDir, stdio: "inherit" },
  );
} else {
  console.log("Found existing SCSK-Backend in ../SCSK-Backend");
}

// 2. Build SCSK-Backend core
console.log("Building SCSK-Backend core engine...");
execSync("pnpm install --frozen-lockfile", {
  cwd: backendDir,
  stdio: "inherit",
});
execSync("pnpm run build", { cwd: backendDir, stdio: "inherit" });

// 3. Install and build Frontend
console.log("Installing and building SCSK-Frontend...");
execSync("pnpm install --frozen-lockfile", { cwd: rootDir, stdio: "inherit" });
execSync("pnpm run build", { cwd: rootDir, stdio: "inherit" });

console.log("\nSetup complete! You can now run:");
console.log("  pnpm run dev          # Start the interactive Testnet demo app");
console.log("  pnpm test             # Run all unit and SSR tests");
console.log("  pnpm run test:e2e     # Run visual regression tests\n");
