import { NextResponse } from "next/server";
import { exportJournal } from "@/server/services/journal-transfer";
import { getSession } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await exportJournal(session.user.id);
    const date = payload.exportedAt.slice(0, 10);
    const body = JSON.stringify(payload, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="code-journal-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("journal export failed:", error);
    return NextResponse.json(
      { error: "Unable to export the journal." },
      { status: 500 },
    );
  }
}
