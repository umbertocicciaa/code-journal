import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { importJournal } from "@/server/services/journal-transfer";
import { getSession } from "@/server/session";
import {
  journalExportSchema,
  journalImportOptionsSchema,
} from "@/server/validation";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 50 * 1024 * 1024;

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 50 MB)." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing JSON file." }, { status: 400 });
  }
  if (file.size > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 50 MB)." },
      { status: 413 },
    );
  }

  const options = journalImportOptionsSchema.safeParse({
    overwriteExisting: formData.get("overwriteExisting") === "true",
  });
  if (!options.success) {
    return NextResponse.json({ error: "Invalid options." }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    return NextResponse.json(
      { error: "The file is not valid JSON." },
      { status: 400 },
    );
  }

  const parsed = journalExportSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.length ? ` at ${issue.path.join(".")}` : "";
    return NextResponse.json(
      {
        error: `This file is not a valid Code Journal export${path}: ${issue?.message ?? "unknown error"}.`,
      },
      { status: 422 },
    );
  }

  try {
    const summary = await importJournal(session.user.id, parsed.data, options.data);

    revalidatePath("/journal");
    revalidatePath("/kanban");
    revalidatePath("/review");
    revalidatePath("/stats");
    revalidatePath("/settings");

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("journal import failed:", error);
    return NextResponse.json(
      { error: "Import failed. No changes were applied." },
      { status: 500 },
    );
  }
}
