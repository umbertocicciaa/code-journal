import { config } from "dotenv";

config({ path: ".env.test" });

process.env.APP_ENCRYPTION_KEY ??=
  Buffer.from("01234567890123456789012345678901").toString("base64");
