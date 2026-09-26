"use server";

import { revalidatePath } from "next/cache";
import { parseTopicsInput } from "@/lib/leetcode-difficulty";
import { slugify } from "@/lib/utils";
import { initializeLeitnerOnSolve } from "@/lib/leitner";
import { parseLeetcodeUrl, buildLeetcodeUrl } from "@/lib/leetcode-url";
import {
  fetchLeetcodeQuestion,
  LeetcodeFetchError,
  mapLeetcodeQuestionToProblemFields,
  problemNeedsLeetcodeEnrichment,
} from "@/server/services/leetcode";
import {
  createProblem,
  findProblemById,
  findProblemBySlug,
  updateProblem,
} from "@/server/repositories/problems";
import {
  createUserProblem,
  createSolution,
  deleteSolution,
  deleteUserProblem,
  findUserProblemById,
  setUserProblemTags,
  updateSolution,
  updateUserProblem,
} from "@/server/repositories/user-problems";
import { getLeetcodeCredentials } from "@/server/repositories/leetcode-credentials";
import { requireSession } from "@/server/session";
import {
  addProblemByUrlSchema,
  manualProblemSchema,
  solutionSchema,
  updateProblemDescriptionSchema,
  updateUserProblemSchema,
} from "@/server/validation";

export type ActionSuccess<T = void> = { success: true; data?: T };
export type ActionFailure = {
  success: false;
  error: string;
  needsManual?: boolean;
  draft?: Record<string, unknown>;
};
export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

function actionError(message: string): ActionFailure {
  return { success: false, error: message };
}

async function safeGetLeetcodeCredentials(userId: string) {
  try {
    return await getLeetcodeCredentials(userId);
  } catch {
    return null;
  }
}

async function fetchAndPersistProblem(
  slug: string,
  userId: string,
  existingProblemId?: string,
) {
  const credentials = await safeGetLeetcodeCredentials(userId);
  const question = await fetchLeetcodeQuestion(slug, credentials ?? undefined);
  const mapped = mapLeetcodeQuestionToProblemFields(question);

  if (existingProblemId) {
    return updateProblem(existingProblemId, {
      ...mapped,
      updatedBy: userId,
    });
  }

  return createProblem({
    ...mapped,
    createdBy: userId,
    updatedBy: userId,
  });
}

export async function addProblemByUrlAction(
  _prev: ActionResult<{ userProblemId: string }>,
  formData: FormData,
): Promise<ActionResult<{ userProblemId: string }>> {
  try {
    const session = await requireSession();
    const parsed = addProblemByUrlSchema.safeParse({
      url: formData.get("url"),
    });

    if (!parsed.success) {
      return actionError("Please enter a valid LeetCode URL");
    }

    const slugFromUrl = parseLeetcodeUrl(parsed.data.url);
    if (!slugFromUrl) {
      return actionError("URL must be a LeetCode problem link");
    }

    let problemRecord = await findProblemBySlug(slugFromUrl.slug);

    if (!problemRecord) {
      try {
        problemRecord = await fetchAndPersistProblem(
          slugFromUrl.slug,
          session.user.id,
        );
      } catch (error) {
        const message =
          error instanceof LeetcodeFetchError
            ? error.message
            : "Failed to fetch problem from LeetCode";

        return {
          success: false,
          error: message,
          needsManual: true,
          draft: {
            slug: slugFromUrl.slug,
            title: slugFromUrl.slug.replace(/-/g, " "),
            url: parsed.data.url,
            difficulty: "MEDIUM",
          },
        };
      }
    } else if (problemNeedsLeetcodeEnrichment(problemRecord)) {
      try {
        problemRecord = await fetchAndPersistProblem(
          slugFromUrl.slug,
          session.user.id,
          problemRecord.id,
        );
      } catch {
        // Keep the existing shared record if enrichment fails.
      }
    }

    if (!problemRecord) {
      return actionError("Unable to create problem");
    }

    const userProblem = await createUserProblem({
      userId: session.user.id,
      problemId: problemRecord.id,
    });

    if (!userProblem) {
      return actionError("Unable to add problem to journal");
    }

    revalidatePath("/journal");
    return { success: true, data: { userProblemId: userProblem.id } };
  } catch (error) {
    console.error("addProblemByUrlAction failed:", error);
    return actionError("Something went wrong while adding the problem.");
  }
}

export async function addManualProblemAction(
  _prev: ActionResult<{ userProblemId: string }>,
  formData: FormData,
): Promise<ActionResult<{ userProblemId: string }>> {
  try {
    const session = await requireSession();

    const topicsText = String(formData.get("topicsText") ?? "").trim();
    const topicsRaw = formData.get("topics");
    const companiesRaw = formData.get("companies");
    let topics: Array<{ slug: string; name: string }> = [];
    let companies: Array<{ slug: string; name: string; frequency?: number }> =
      [];

    try {
      if (topicsText) {
        topics = parseTopicsInput(topicsText);
      } else if (topicsRaw) {
        const parsedTopics = JSON.parse(String(topicsRaw));
        if (Array.isArray(parsedTopics) && parsedTopics.length > 0) {
          topics = parsedTopics;
        }
      }
      companies = companiesRaw ? JSON.parse(String(companiesRaw)) : [];
    } catch {
      return actionError("Invalid topics or companies format");
    }

    const parsed = manualProblemSchema.safeParse({
      slug: formData.get("slug") || slugify(String(formData.get("title") ?? "")),
      title: formData.get("title"),
      difficulty: formData.get("difficulty"),
      descriptionMd: formData.get("descriptionMd") ?? "",
      url:
        formData.get("url") ||
        buildLeetcodeUrl(String(formData.get("slug") ?? "")),
      topics,
      companies,
    });

    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    let problemRecord = await findProblemBySlug(parsed.data.slug);
    if (!problemRecord) {
      problemRecord = await createProblem({
        ...parsed.data,
        source: "manual",
        createdBy: session.user.id,
        updatedBy: session.user.id,
      });
    }

    if (!problemRecord) {
      return actionError("Unable to create problem");
    }

    const userProblem = await createUserProblem({
      userId: session.user.id,
      problemId: problemRecord.id,
    });

    if (!userProblem) {
      return actionError("Unable to add problem to journal");
    }

    revalidatePath("/journal");
    return { success: true, data: { userProblemId: userProblem.id } };
  } catch (error) {
    console.error("addManualProblemAction failed:", error);
    return actionError("Something went wrong while saving the problem.");
  }
}

export async function refreshProblemFromLeetcodeAction(problemId: string) {
  try {
    const session = await requireSession();
    const existingProblem = await findProblemById(problemId);

    if (!existingProblem) {
      return actionError("Problem not found");
    }

    const updated = await fetchAndPersistProblem(
      existingProblem.slug,
      session.user.id,
      problemId,
    );

    if (!updated) {
      return actionError("Failed to refresh problem");
    }

    revalidatePath("/journal");
    return { success: true as const };
  } catch (error) {
    const message =
      error instanceof LeetcodeFetchError
        ? error.message
        : "Failed to refresh from LeetCode";
    return actionError(message);
  }
}

export async function updateProblemDescriptionAction(
  userProblemId: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const parsed = updateProblemDescriptionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Invalid description");
    }

    const existing = await findUserProblemById(session.user.id, userProblemId);
    if (!existing) {
      return actionError("Problem not found");
    }

    const updated = await updateProblem(existing.problem.id, {
      descriptionMd: parsed.data.descriptionMd,
      updatedBy: session.user.id,
    });

    if (!updated) {
      return actionError("Unable to update this description.");
    }

    revalidatePath("/journal");
    revalidatePath(`/journal/${userProblemId}`);
    return { success: true };
  } catch (error) {
    console.error("updateProblemDescriptionAction failed:", error);
    return actionError("Unable to update this description.");
  }
}

export async function updateUserProblemAction(
  userProblemId: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const parsed = updateUserProblemSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Invalid input");
    }

    const existing = await findUserProblemById(session.user.id, userProblemId);
    if (!existing) {
      return actionError("Problem not found");
    }

    const updates: Parameters<typeof updateUserProblem>[2] = {};
    if (parsed.data.notesMd !== undefined) {
      updates.notesMd = parsed.data.notesMd;
    }

    if (parsed.data.status && parsed.data.status !== existing.status) {
      updates.status = parsed.data.status;
      if (parsed.data.status === "solved") {
        const leitner = initializeLeitnerOnSolve();
        updates.solvedAt = new Date();
        updates.leitnerBox = leitner.leitnerBox;
        updates.nextReviewAt = leitner.nextReviewAt;
        updates.lastReviewedAt = leitner.lastReviewedAt;
        updates.reviewCount = leitner.reviewCount;
      }
    }

    await updateUserProblem(session.user.id, userProblemId, updates);

    if (parsed.data.tagIds) {
      await setUserProblemTags(
        session.user.id,
        userProblemId,
        parsed.data.tagIds,
      );
    }

    revalidatePath("/journal");
    revalidatePath(`/journal/${userProblemId}`);
    revalidatePath("/kanban");
    revalidatePath("/review");
    revalidatePath("/stats");
    return { success: true };
  } catch (error) {
    console.error("updateUserProblemAction failed:", error);
    return actionError("Unable to update this problem.");
  }
}

export async function deleteUserProblemAction(userProblemId: string) {
  try {
    const session = await requireSession();
    await deleteUserProblem(session.user.id, userProblemId);
    revalidatePath("/journal");
    revalidatePath("/kanban");
    revalidatePath("/review");
    revalidatePath("/stats");
    return { success: true as const };
  } catch (error) {
    console.error("deleteUserProblemAction failed:", error);
    return actionError("Unable to delete this problem.");
  }
}

export async function createSolutionAction(
  userProblemId: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const parsed = solutionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Invalid solution");
    }

    const owned = await findUserProblemById(session.user.id, userProblemId);
    if (!owned) {
      return actionError("Problem not found");
    }

    await createSolution({
      userProblemId,
      ...parsed.data,
    });

    revalidatePath(`/journal/${userProblemId}`);
    revalidatePath("/stats");
    return { success: true };
  } catch (error) {
    console.error("createSolutionAction failed:", error);
    return actionError("Unable to save the solution.");
  }
}

export async function updateSolutionAction(
  solutionId: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const parsed = solutionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Invalid solution");
    }

    const updated = await updateSolution(session.user.id, solutionId, parsed.data);
    if (!updated) {
      return actionError("Solution not found");
    }

    revalidatePath(`/journal/${updated.userProblemId}`);
    revalidatePath("/journal");
    revalidatePath("/stats");
    return { success: true };
  } catch (error) {
    console.error("updateSolutionAction failed:", error);
    return actionError("Unable to update the solution.");
  }
}

export async function deleteSolutionAction(solutionId: string) {
  try {
    const session = await requireSession();
    const deleted = await deleteSolution(session.user.id, solutionId);
    if (!deleted) {
      return actionError("Solution not found");
    }
    revalidatePath("/journal");
    revalidatePath("/stats");
    return { success: true as const };
  } catch (error) {
    console.error("deleteSolutionAction failed:", error);
    return actionError("Unable to delete the solution.");
  }
}
