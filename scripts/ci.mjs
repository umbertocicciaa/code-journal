import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.ci" });

const composeArgs = ["-p", "code-journal-ci", "-f", "docker-compose.ci.yml", "up", "-d", "--wait", "db"];
const downArgs = ["-p", "code-journal-ci", "-f", "docker-compose.ci.yml", "down", "--volumes", "--remove-orphans"];

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

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env },
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

// Build is a prerequisite for the production server used by the smoke suite.
run("npm", ["run", "db:generate"]);
run("npm", ["run", "db:migrate"]);
run("npm", ["run", "build"]);

// Install the browser required by the smoke suite. CI runners do not ship with
// Playwright browsers preinstalled; Linux also needs the browser system packages.
const playwrightInstallArgs =
  process.platform === "linux"
    ? ["playwright", "install", "--with-deps", "chromium"]
    : ["playwright", "install", "chromium"];
run("npx", playwrightInstallArgs);

// Smoke tests run first so the critical user journey fails fast before
// slower unit/integration checks.
run("npm", ["run", "test:e2e"]);

run("npm", ["run", "lint"]);
run("npm", ["run", "typecheck"]);
run("npm", ["run", "test"]);
run("npm", ["run", "test:integration"]);
