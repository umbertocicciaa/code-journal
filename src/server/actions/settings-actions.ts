"use server";

import { revalidatePath } from "next/cache";
import { verifyLeetcodeCredentials } from "@/server/services/leetcode";
import { verifyNeetcodeCredentials } from "@/server/services/neetcode";
import {
  deleteLeetcodeCredentials,
  saveLeetcodeCredentials,
} from "@/server/repositories/leetcode-credentials";
import {
  deleteNeetcodeCredentials,
  saveNeetcodeCredentials,
} from "@/server/repositories/neetcode-credentials";
import { updateUserSettings } from "@/server/repositories/users";
import { requireSession } from "@/server/session";
import {
  leetcodeCredentialSchema,
  neetcodeCredentialSchema,
  updateSettingsSchema,
  userTagSchema,
} from "@/server/validation";
import {
  createUserTag,
  deleteUserTag,
} from "@/server/repositories/user-problems";

export async function updateSettingsAction(input: unknown) {
  try {
    const session = await requireSession();
    const parsed = updateSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid settings" } as const;
    }

    await updateUserSettings(session.user.id, parsed.data);
    revalidatePath("/settings");
    const username =
      "username" in session.user ? String(session.user.username) : null;
    if (username) {
      revalidatePath(`/u/${username}`);
    }
    return { success: true } as const;
  } catch (error) {
    console.error("updateSettingsAction failed:", error);
    return { success: false, error: "Unable to update settings." } as const;
  }
}

export async function saveLeetcodeCredentialAction(input: unknown) {
  try {
    const session = await requireSession();
    const parsed = leetcodeCredentialSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid credentials" } as const;
    }

    const verified = await verifyLeetcodeCredentials(parsed.data);
    if (!verified) {
      return {
        success: false,
        error: "Could not verify LeetCode session. Check your cookies.",
      } as const;
    }

    await saveLeetcodeCredentials(session.user.id, parsed.data, true);
    revalidatePath("/settings");
    return { success: true } as const;
  } catch (error) {
    console.error("saveLeetcodeCredentialAction failed:", error);
    return {
      success: false,
      error: "Unable to save LeetCode credentials.",
    } as const;
  }
}

export async function deleteLeetcodeCredentialAction() {
  try {
    const session = await requireSession();
    await deleteLeetcodeCredentials(session.user.id);
    revalidatePath("/settings");
    return { success: true } as const;
  } catch (error) {
    console.error("deleteLeetcodeCredentialAction failed:", error);
    return {
      success: false,
      error: "Unable to remove LeetCode credentials.",
    } as const;
  }
}

export async function saveNeetcodeCredentialAction(input: unknown) {
  try {
    const session = await requireSession();
    const parsed = neetcodeCredentialSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid credentials" } as const;
    }

    const verified = await verifyNeetcodeCredentials(parsed.data.refreshToken);
    if (!verified) {
      return {
        success: false,
        error: "Could not verify NeetCode session. Check your refresh token.",
      } as const;
    }

    await saveNeetcodeCredentials(session.user.id, parsed.data, true);
    revalidatePath("/settings");
    return { success: true } as const;
  } catch (error) {
    console.error("saveNeetcodeCredentialAction failed:", error);
    return {
      success: false,
      error: "Unable to save NeetCode credentials.",
    } as const;
  }
}

export async function deleteNeetcodeCredentialAction() {
  try {
    const session = await requireSession();
    await deleteNeetcodeCredentials(session.user.id);
    revalidatePath("/settings");
    return { success: true } as const;
  } catch (error) {
    console.error("deleteNeetcodeCredentialAction failed:", error);
    return {
      success: false,
      error: "Unable to remove NeetCode credentials.",
    } as const;
  }
}

export async function createUserTagAction(input: unknown) {
  try {
    const session = await requireSession();
    const parsed = userTagSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid tag" } as const;
    }

    await createUserTag({
      userId: session.user.id,
      name: parsed.data.name,
      color: parsed.data.color,
    });
    revalidatePath("/journal");
    revalidatePath("/settings");
    return { success: true } as const;
  } catch (error) {
    console.error("createUserTagAction failed:", error);
    return { success: false, error: "Unable to create tag." } as const;
  }
}

export async function deleteUserTagAction(tagId: string) {
  try {
    const session = await requireSession();
    await deleteUserTag(session.user.id, tagId);
    revalidatePath("/journal");
    revalidatePath("/settings");
    return { success: true } as const;
  } catch (error) {
    console.error("deleteUserTagAction failed:", error);
    return { success: false, error: "Unable to delete tag." } as const;
  }
}
