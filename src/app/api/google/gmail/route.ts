import { NextRequest, NextResponse } from "next/server";
import { getGmail } from "@/lib/google";

export async function GET(req: NextRequest) {
  try {
    const gmail = await getGmail();
    const action = req.nextUrl.searchParams.get("action") || "list";

    if (action === "labels") {
      const res = await gmail.users.labels.list({ userId: "me" });
      return NextResponse.json(res.data);
    }

    if (action === "get") {
      const id = req.nextUrl.searchParams.get("id")!;
      const res = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "full",
      });
      return NextResponse.json(res.data);
    }

    // List messages
    const q = req.nextUrl.searchParams.get("q") || "";
    const labelIds = req.nextUrl.searchParams.get("labelIds") || "INBOX";
    const pageToken = req.nextUrl.searchParams.get("pageToken") || undefined;

    const res = await gmail.users.messages.list({
      userId: "me",
      q,
      labelIds: [labelIds],
      maxResults: 20,
      pageToken,
    });

    // Fetch message details
    const messages = res.data.messages || [];
    const detailed = await Promise.all(
      messages.slice(0, 20).map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date"],
        });
        return detail.data;
      })
    );

    return NextResponse.json({
      messages: detailed,
      nextPageToken: res.data.nextPageToken,
      resultSizeEstimate: res.data.resultSizeEstimate,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gmail = await getGmail();
    const { to, subject, body, cc, bcc } = await req.json();

    const headers = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      bcc ? `Bcc: ${bcc}` : "",
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      body,
    ]
      .filter(Boolean)
      .join("\r\n");

    const encodedMessage = Buffer.from(headers)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const gmail = await getGmail();
    const { id } = await req.json();
    await gmail.users.messages.trash({ userId: "me", id });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
