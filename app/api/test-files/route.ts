import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const TEST_DIR = path.join(process.cwd(), "testCVdata");

export async function GET() {
  try {
    const entries = await readdir(TEST_DIR);
    const files = [];

    for (const name of entries) {
      if (name.startsWith(".")) continue;
      const fullPath = path.join(TEST_DIR, name);
      const info = await stat(fullPath);
      if (!info.isFile()) continue;
      files.push({
        name,
        sizeBytes: info.size,
        sizeLabel: info.size > 1024 * 1024
          ? `${(info.size / (1024 * 1024)).toFixed(1)} MB`
          : `${(info.size / 1024).toFixed(0)} KB`,
      });
    }

    files.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [], error: "Could not read test files directory" });
  }
}
