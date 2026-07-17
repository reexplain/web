import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MAX_PDF_SIZE_BYTES, PDF_CONTENT_TYPE } from "@/utils/constants";

const FASTAPI_URL = process.env.REEXPLAIN_API_URL ?? "http://127.0.0.1:8000";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const incomingForm = await request.formData();
  const file = incomingForm.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }

  if (file.type !== PDF_CONTENT_TYPE) {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 415 });
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json(
      { error: "PDF files must be 20 MB or smaller." },
      { status: 413 },
    );
  }

  const upstreamForm = new FormData();
  upstreamForm.set("file", file, file.name);

  try {
    const response = await fetch(`${FASTAPI_URL}/api/v1/pdf/extract`, {
      method: "POST",
      body: upstreamForm,
      cache: "no-store",
    });
    const body = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: body.detail ?? "The PDF could not be extracted." },
        { status: response.status },
      );
    }

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "The document service is currently unavailable." },
      { status: 503 },
    );
  }
}
