import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.ci" });

const composeArgs = ["-f", "docker-compose.ci.yml", "up", "-d", "--wait", "db"];
const downArgs = ["-f", "docker-compose.ci.yml", "down", "--volumes"];

const up = spawnSync("docker", ["compose", ...composeArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (up.status !== 0) {
  process.exit(up.status ?? 1);
}

const cleanup = () => {
  spawnSync("docker", ["compose", ...downArgs], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
};

process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

const result = spawnSync("npm", ["run", "ci"], {
  stdio: "inherit",
  env: { ...process.env },
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
