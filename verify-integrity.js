/**
 * 🎌 IQBAL CV BOT - INTEGRITY VERIFICATION SYSTEM 🎌
 * 
 * 🔐 CREATED BY: KIFZL & PARTNER/SUPPORT IQBAL DEV
 * 
 * Purpose: Verify project integrity & detect unauthorized modifications
 * If credits are removed/changed: Bot either ERRORS or LOGS WARNING
 * 
 * Mode Options:
 * - STRICT: Bot ERROR & EXIT if tampering detected
 * - WARNING: Bot continue but LOG detection
 */

import fs from "fs";
import config from "./config.js";

// ════════════════════════════════════════════════════════════════
// CONFIGURATION - Choose Mode
// ════════════════════════════════════════════════════════════════

const INTEGRITY_MODE = process.env.INTEGRITY_MODE || "WARNING";
// Options: "STRICT" (error on tampering) or "WARNING" (log only)

// ════════════════════════════════════════════════════════════════
// CRITICAL STRINGS TO VERIFY
// ════════════════════════════════════════════════════════════════

const REQUIRED_CREDITS = [
  "KIFZL",
  "IQBAL DEV",
  "KIKI FZL"
];

// ════════════════════════════════════════════════════════════════
// VERIFY INTEGRITY
// ════════════════════════════════════════════════════════════════

export function verifyProjectIntegrity() {
  const violations = [];

  // 1. Check config.js watermark
  if (!config.watermark || !config.watermark.includes("KIFZL")) {
    violations.push("❌ config.js watermark removed/modified");
  }

  if (!config.copyright || !config.copyright.includes("KIFZL")) {
    violations.push("❌ config.js copyright removed/modified");
  }

  if (!config.botCreator || !config.botCreator.includes("KIFZL")) {
    violations.push("❌ config.js botCreator removed/modified");
  }

  // 2. Check index.js for copyright banner
  try {
    const indexContent = fs.readFileSync("./index.js", "utf8");
    if (!indexContent.includes("KIFZL") || !indexContent.includes("OFFICIAL PROJECT")) {
      violations.push("❌ index.js copyright header removed/modified");
    }
  } catch (e) {
    violations.push("⚠️  Cannot read index.js for verification");
  }

  // 3. Check package.json author
  try {
    const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    if (!packageJson.author || !packageJson.author.includes("KIFZL")) {
      violations.push("❌ package.json author removed/modified");
    }
  } catch (e) {
    violations.push("⚠️  Cannot read package.json for verification");
  }

  // Return results
  return {
    isValid: violations.length === 0,
    violations: violations,
    timestamp: new Date().toISOString(),
    mode: INTEGRITY_MODE
  };
}

// ════════════════════════════════════════════════════════════════
// HANDLE VIOLATIONS
// ════════════════════════════════════════════════════════════════

export function handleIntegrityViolations(result) {
  if (result.isValid) {
    console.log("✅ Project Integrity: VERIFIED");
    console.log("✅ All credits: INTACT");
    return true;
  }

  // Print violations
  console.log("\n" + "═".repeat(70));
  console.log("🚨 PROJECT INTEGRITY VIOLATION DETECTED! 🚨");
  console.log("═".repeat(70));
  console.log("\n⚠️  TAMPERING DETECTED:");
  result.violations.forEach(v => console.log("   " + v));
  console.log("\n🔐 Credits Status: MODIFIED/REMOVED");
  console.log("📝 Original Creator: KIFZL & PARTNER/SUPPORT IQBAL DEV");
  console.log("🌐 Repository: https://github.com/kyhosting/Iqbal-Bot");
  console.log("\n" + "═".repeat(70));

  // Strict Mode: EXIT
  if (INTEGRITY_MODE === "STRICT") {
    console.log("🛑 INTEGRITY MODE: STRICT");
    console.log("❌ Bot cannot start - credits have been modified!");
    console.log("❌ To fix: Restore original project from GitHub");
    console.log("❌ https://github.com/kyhosting/Iqbal-Bot");
    console.log("\n🔒 Exiting to prevent unauthorized use...\n");
    process.exit(1);
  }

  // Warning Mode: CONTINUE with logging
  if (INTEGRITY_MODE === "WARNING") {
    console.log("⚠️  INTEGRITY MODE: WARNING");
    console.log("⚠️  Credits modified but bot will continue");
    console.log("⚠️  This action may violate MIT License");
    console.log("⚠️  Original author: KIFZL & PARTNER/SUPPORT IQBAL DEV");
    console.log("⚠️  See: https://github.com/kyhosting/Iqbal-Bot/blob/main/LICENSE");
    console.log("\n⏱️  Continuing in 3 seconds...\n");
    
    // Log to file for audit
    try {
      const logEntry = `[${new Date().toISOString()}] INTEGRITY VIOLATION DETECTED\n`;
      const violations_str = result.violations.map(v => `  ${v}`).join("\n");
      const fullLog = logEntry + violations_str + "\n";
      fs.appendFileSync(".integrity-log", fullLog);
    } catch (e) {
      console.warn("⚠️  Could not write integrity log");
    }
    
    return true;
  }

  return false;
}

// ════════════════════════════════════════════════════════════════
// EXPORT VERIFICATION FUNCTION FOR BOT USAGE
// ════════════════════════════════════════════════════════════════

export function isIntegrityValid() {
  const result = verifyProjectIntegrity();
  return result.isValid;
}

export function getIntegrityStatus() {
  return verifyProjectIntegrity();
}

// ════════════════════════════════════════════════════════════════
// RUN VERIFICATION
// ════════════════════════════════════════════════════════════════

const integrityResult = verifyProjectIntegrity();
handleIntegrityViolations(integrityResult);

export default {
  verify: verifyProjectIntegrity,
  handle: handleIntegrityViolations,
  isValid: () => isIntegrityValid(),
  getStatus: getIntegrityStatus,
  mode: INTEGRITY_MODE
};
