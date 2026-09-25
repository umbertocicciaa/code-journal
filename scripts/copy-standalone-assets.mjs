import { cpSync, existsSync, mkdirSync } from "node:fs";

const standaloneRoot = ".next/standalone";
const staticSource = ".next/static";
const staticDestination = ".next/standalone/.next/static";
const publicSource = "public";
const publicDestination = ".next/standalone/public";

if (!existsSync(standaloneRoot)) {
  throw new Error(`Next.js standalone output not found at ${standaloneRoot}`);
}

mkdirSync(staticDestination, { recursive: true });
cpSync(staticSource, staticDestination, { recursive: true });

if (existsSync(publicSource)) {
  mkdirSync(publicDestination, { recursive: true });
  cpSync(publicSource, publicDestination, { recursive: true });
}
