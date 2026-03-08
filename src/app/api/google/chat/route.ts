import { NextRequest, NextResponse } from "next/server";
import { getChat } from "@/lib/google";

export async function GET(req: NextRequest) {
  try {
    const chat = await getChat();
    const action = req.nextUrl.searchParams.get("action") || "spaces";

    if (action === "spaces") {
      const res = await chat.spaces.list({ pageSize: 50 });
      return NextResponse.json(res.data);
    }

    if (action === "messages") {
      const spaceName = req.nextUrl.searchParams.get("spaceName")!;
      const res = await chat.spaces.messages.list({
        parent: spaceName,
        pageSize: 25,
        orderBy: "createTime desc",
      });
      return NextResponse.json(res.data);
    }

    if (action === "members") {
      const spaceName = req.nextUrl.searchParams.get("spaceName")!;
      const res = await chat.spaces.members.list({
        parent: spaceName,
        pageSize: 100,
      });
      return NextResponse.json(res.data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const chat = await getChat();
    const { spaceName, text } = await req.json();

    const res = await chat.spaces.messages.create({
      parent: spaceName,
      requestBody: { text },
    });

    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
