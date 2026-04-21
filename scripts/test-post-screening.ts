import "dotenv/config";
import { invokeAutomation, pollRun } from "../lib/kognitos";

const CALL_SCHEDULING_ID = "Bw4Hy2zzjrYIRZ72C6xCA";

async function testCase(label: string, inputs: Record<string, unknown>) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: ${label}`);
  console.log(`${"=".repeat(60)}`);

  const { runId, error } = await invokeAutomation(
    CALL_SCHEDULING_ID,
    inputs,
    "AUTOMATION_STAGE_DRAFT",
  );

  if (!runId) {
    console.error("Invoke failed:", error);
    return;
  }
  console.log(`Run ID: ${runId} — polling...`);

  const result = await pollRun(CALL_SCHEDULING_ID, runId, 60_000);

  console.log(`\nStatus: ${result.status}`);
  if (result.error) console.log(`Error: ${result.error}`);

  if (result.status === "completed") {
    for (const [key, value] of Object.entries(result.outputs)) {
      console.log(`\n--- ${key} ---`);
      console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
    }
  }
}

async function main() {
  // Test 1: Accepted candidate
  await testCase("Accepted Candidate (Open)", {
    candidate_name: { text: "John Doe" },
    email: { text: "john.doe@gmail.com" },
    candidate_status: { text: "Open" },
    role: { text: "Applied ML Engineer" },
    job_opening_id: { text: "HR-OPN-2026-0002" },
    screening_summary: { text: "Strong technical background in ML with 5 years of experience." },
  });

  // Test 2: Rejected candidate
  await testCase("Rejected Candidate", {
    candidate_name: { text: "Klaus Muller" },
    email: { text: "klaus.muller.design@email.de" },
    candidate_status: { text: "Rejected" },
    role: { text: "Kognitos Software Engineer" },
    job_opening_id: { text: "HR-OPN-2025-0008" },
    screening_summary: { text: "Limited relevant experience for the role requirements." },
  });

  console.log("\n\nAll tests complete.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
