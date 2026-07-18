import { NextResponse } from "next/server";
import { internal } from "@/convex/_generated/api";
import { auth } from "@/lib/auth";
import { queryConvexInternal } from "@/lib/convex-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const documents = await queryConvexInternal(internal.documents.listForOwner, {
      ownerId: session.user.id,
    });

    return NextResponse.json({ documents });
  } catch {
    return NextResponse.json(
      { error: "Document storage is currently unavailable." },
      { status: 503 },
    );
  }
}