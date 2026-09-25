import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.ci" });

const result = spawnSync("npm", ["run", "ci"], {
  stdio: "inherit",
  env: { ...process.env },
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
