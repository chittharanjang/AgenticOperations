import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN = process.env.KOGNITOS_TOKEN!;
const ORG_ID = process.env.KOGNITOS_ORG_ID!;
const BASE_URL = process.env.KOGNITOS_BASE_URL!;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file);

  const res = await fetch(
    `${BASE_URL}/organizations/${ORG_ID}/files:upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: uploadForm,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Upload failed (${res.status}): ${text.slice(0, 200)}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const remotePath = data.metadata?.name;

  if (!remotePath) {
    return NextResponse.json({ error: "Upload succeeded but no file path returned" }, { status: 500 });
  }

  return NextResponse.json({
    remotePath,
    filename: data.metadata.filename,
    sizeBytes: data.metadata.sizeBytes,
    mimeType: data.metadata.mimeType,
  });
}
