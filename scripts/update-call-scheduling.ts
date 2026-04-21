import "dotenv/config";
import { createQuillThread, askQuill } from "../lib/quill";

const CALL_SCHEDULING_ID = "Bw4Hy2zzjrYIRZ72C6xCA";

const INSTRUCTION = `
Rewrite this automation completely. It should be called "Candidate Post-Screening Communication" with this description: "Drafts a follow-up email to the candidate based on their screening result — an interview invitation if accepted, or a polite rejection if not a fit."

The automation accepts 6 text inputs:
- candidate_name
- email
- candidate_status (will be "Open" for accepted or "Rejected" for rejected)
- role (the job title, e.g. "Applied ML Engineer")
- job_opening_id (e.g. "HR-OPN-2025-0008")
- screening_summary (a brief summary of the screening assessment)

Logic:
1. Check the value of candidate_status.

2. If candidate_status is "Open" or "Accepted":
   - Build the subject line: "Interview Invitation — " + role + " at Uber Shared Services"
   - Build the email body:
     "Dear " + candidate_name + ",\\n\\nThank you for your interest in the " + role + " position (Ref: " + job_opening_id + ").\\n\\nWe are pleased to inform you that your application has been reviewed and we would like to invite you for an in-person interview. Our recruitment team will reach out shortly to schedule a convenient date and time.\\n\\nWe look forward to meeting you.\\n\\nBest regards,\\nUber Shared Services Recruiting Team"
   - Set email_type to "interview_invite"
   - Set confirmation to "Interview invite drafted for " + candidate_name

3. If candidate_status is "Rejected" or anything else:
   - Build the subject line: "Application Update — " + role + " at Uber Shared Services"
   - Build the email body:
     "Dear " + candidate_name + ",\\n\\nThank you for taking the time to apply for the " + role + " position (Ref: " + job_opening_id + ").\\n\\nAfter careful review of your resume, we have determined that your profile is not the best fit for this particular role at this time. We encourage you to apply for future openings that may better align with your skills and experience.\\n\\nWe wish you the best in your career endeavors.\\n\\nBest regards,\\nUber Shared Services Recruiting Team"
   - Set email_type to "rejection"
   - Set confirmation to "Rejection email drafted for " + candidate_name

4. Combine subject and body: draft_email = "Subject: " + subject + "\\n\\n" + body

5. Set three outputs:
   - set_output("draft_email", value=draft_email)
   - set_output("email_type", value=email_type)
   - set_output("confirmation", value=confirmation)
`;

async function main() {
  console.log("Creating Quill thread for Call Scheduling automation...");
  const threadId = await createQuillThread(CALL_SCHEDULING_ID);
  console.log(`Thread created: ${threadId}\n`);

  console.log("Sending instruction to Quill...");
  const result = await askQuill(threadId, INSTRUCTION);

  console.log("\n=== Quill Response ===");
  console.log(result.answer.slice(0, 1000));
  if (result.answer.length > 1000) console.log("...(truncated)");

  if (result.thinkingSteps.length > 0) {
    console.log("\n=== Thinking Steps ===");
    for (const step of result.thinkingSteps.slice(0, 5)) {
      console.log(`  - ${step.slice(0, 200)}`);
    }
  }

  if (result.executionIds.length > 0) {
    console.log("\n=== Execution IDs ===");
    for (const id of result.executionIds) {
      console.log(`  ${id}`);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
