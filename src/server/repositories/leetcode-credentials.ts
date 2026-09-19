import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { db } from "@/server/db/client";
import { leetcodeCredential } from "@/server/db/schema";

export async function getLeetcodeCredentials(userId: string) {
  const row = await db.query.leetcodeCredential.findFirst({
    where: eq(leetcodeCredential.userId, userId),
  });
  if (!row) {
    return null;
  }
  return {
    session: decryptSecret(row.sessionEnc),
    csrf: decryptSecret(row.csrfEnc),
    lastVerifiedAt: row.lastVerifiedAt,
    updatedAt: row.updatedAt,
  };
}

export async function saveLeetcodeCredentials(
  userId: string,
  credentials: { session: string; csrf: string },
  verified: boolean,
) {
  const existing = await db.query.leetcodeCredential.findFirst({
    where: eq(leetcodeCredential.userId, userId),
  });

  const values = {
    sessionEnc: encryptSecret(credentials.session),
    csrfEnc: encryptSecret(credentials.csrf),
    updatedAt: new Date(),
    lastVerifiedAt: verified ? new Date() : null,
  };

  if (existing) {
    await db
      .update(leetcodeCredential)
      .set(values)
      .where(eq(leetcodeCredential.id, existing.id));
    return;
  }

  await db.insert(leetcodeCredential).values({
    id: nanoid(),
    userId,
    ...values,
  });
}

export async function deleteLeetcodeCredentials(userId: string) {
  await db
    .delete(leetcodeCredential)
    .where(eq(leetcodeCredential.userId, userId));
}
