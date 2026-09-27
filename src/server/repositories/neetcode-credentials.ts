import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { db } from "@/server/db/client";
import { neetcodeCredential } from "@/server/db/schema";

export async function getNeetcodeCredentials(userId: string) {
  const row = await db.query.neetcodeCredential.findFirst({
    where: eq(neetcodeCredential.userId, userId),
  });
  if (!row) {
    return null;
  }
  return {
    refreshToken: decryptSecret(row.refreshTokenEnc),
    lastVerifiedAt: row.lastVerifiedAt,
    updatedAt: row.updatedAt,
  };
}

export async function saveNeetcodeCredentials(
  userId: string,
  credentials: { refreshToken: string },
  verified: boolean,
) {
  const existing = await db.query.neetcodeCredential.findFirst({
    where: eq(neetcodeCredential.userId, userId),
  });

  const values = {
    refreshTokenEnc: encryptSecret(credentials.refreshToken),
    updatedAt: new Date(),
    lastVerifiedAt: verified ? new Date() : null,
  };

  if (existing) {
    await db
      .update(neetcodeCredential)
      .set(values)
      .where(eq(neetcodeCredential.id, existing.id));
    return;
  }

  await db.insert(neetcodeCredential).values({
    id: nanoid(),
    userId,
    ...values,
  });
}

export async function deleteNeetcodeCredentials(userId: string) {
  await db
    .delete(neetcodeCredential)
    .where(eq(neetcodeCredential.userId, userId));
}
