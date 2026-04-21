import "dotenv/config";
import { createQuillThread, askQuill } from "../lib/quill";

const INTERVIEW_ADVANCEMENT_ID = "G4nJADaCneq0h2tLHwGlX";

const INSTRUCTION = `
Rewrite this automation completely. It should be called "Interview Scheduling" with this description: "Drafts an interview scheduling email proposing 3 available time slots for the candidate to choose from."

The automation accepts 4 text inputs:
- candidate_name
- email
- role (the job title, e.g. "Applied ML Engineer")
- job_opening_id (e.g. "HR-OPN-2026-0002")

Logic:
1. Calculate 3 proposed interview time slots. Use these fixed slots based on the next few business days:
   - Slot 1: "Monday, 10:00 AM - 11:00 AM"
   - Slot 2: "Wednesday, 2:00 PM - 3:00 PM"
   - Slot 3: "Friday, 11:00 AM - 12:00 PM"

2. Build the subject line: "Interview Scheduling — " + role + " at Uber Shared Services"

3. Build the email body:
   "Dear " + candidate_name + ",\\n\\nFollowing our review of your application for the " + role + " position (Ref: " + job_opening_id + "), we would like to schedule your in-person interview.\\n\\nPlease select one of the following available time slots:\\n\\n1. " + slot_1 + "\\n2. " + slot_2 + "\\n3. " + slot_3 + "\\n\\nPlease reply to this email with your preferred slot, and we will send you a calendar invite with the location and meeting details.\\n\\nWe look forward to meeting you.\\n\\nBest regards,\\nUber Shared Services Recruiting Team"

4. Combine subject and body: draft_email = "Subject: " + subject + "\\n\\n" + body

5. Set confirmation to "Interview scheduling email drafted for " + candidate_name + " — 3 time slots proposed"

6. Set two outputs:
   - set_output("draft_email", value=draft_email)
   - set_output("confirmation", value=confirmation)
`;

async function main() {
  console.log("Creating Quill thread for Interview Stage Advancement automation...");
  const threadId = await createQuillThread(INTERVIEW_ADVANCEMENT_ID);
  console.log(`Thread created: ${threadId}\n`);

  console.log("Sending instruction to Quill...");
  const result = await askQuill(threadId, INSTRUCTION);

  console.log("\n=== Quill Response ===");
  console.log(result.answer.slice(0, 1500));
  if (result.answer.length > 1500) console.log("...(truncated)");

  if (result.thinkingSteps.length > 0) {
    console.log("\n=== Thinking Steps ===");
    for (const step of result.thinkingSteps.slice(0, 5)) {
      console.log(`  - ${step.slice(0, 200)}`);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
