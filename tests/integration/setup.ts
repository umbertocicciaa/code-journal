import { config } from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { beforeAll } from "vitest";

config({ path: ".env.test" });

process.env.APP_ENCRYPTION_KEY ??=
  Buffer.from("01234567890123456789012345678901").toString("base64");

beforeAll(async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set for integration tests");
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await client.end();
}, 60_000);
