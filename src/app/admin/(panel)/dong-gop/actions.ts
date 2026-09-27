"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function handleSubmission(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("id"));
  const status = form.get("decision") === "accept" ? "ACCEPTED" : "REJECTED";
  const note = String(form.get("note") ?? "").trim() || null;
  await db
    .update(s.submissions)
    .set({ status, handlerNote: note, handledAt: new Date(), handledById: user.id })
    .where(eq(s.submissions.id, id));
  await audit(user, status === "ACCEPTED" ? "accept" : "reject", "Submission", id, `${status === "ACCEPTED" ? "Chấp nhận" : "Từ chối"} đóng góp${note ? `: ${note}` : ""}`);
  revalidatePath("/admin", "layout");
  redirect("/admin/dong-gop?msg=done");
}
