import "dotenv/config";
import { run } from "./agent.js";

const dryRun = process.argv.includes("--dry-run");

run({ dryRun }).catch((err) => {
  console.error("\nAI BLOG AGENT FAILED\n");
  console.error(err?.stack || err);
  process.exit(1);
});
