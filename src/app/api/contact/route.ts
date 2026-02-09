import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/server/mails";

interface ContactPayload {
  company: string;
  email: string;
  message: string;
  lang?: "en" | "da";
}

export async function POST(request: Request) {
  const { company, email, message, lang } =
    (await request.json()) as ContactPayload;

  if (!company || !email || !message) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  try {
    await sendContactEmail(company, email, message, lang ?? "en");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Mail error:", err);
    return NextResponse.json(
      { error: "Error sending email." },
      { status: 500 }
    );
  }
}
