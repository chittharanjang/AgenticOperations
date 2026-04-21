import { JOB_OPENINGS } from "@/lib/job-openings";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ openings: JOB_OPENINGS });
}
