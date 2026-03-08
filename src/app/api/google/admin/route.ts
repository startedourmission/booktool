import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/google";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdmin();
    const action = req.nextUrl.searchParams.get("action") || "users";

    if (action === "users") {
      const domain = req.nextUrl.searchParams.get("domain");
      const query = req.nextUrl.searchParams.get("query") || undefined;
      const res = await admin.users.list({
        domain: domain || undefined,
        customer: domain ? undefined : "my_customer",
        maxResults: 50,
        query,
        orderBy: "email",
      });
      return NextResponse.json(res.data);
    }

    if (action === "user") {
      const userKey = req.nextUrl.searchParams.get("userKey")!;
      const res = await admin.users.get({ userKey });
      return NextResponse.json(res.data);
    }

    if (action === "groups") {
      const domain = req.nextUrl.searchParams.get("domain");
      const res = await admin.groups.list({
        domain: domain || undefined,
        customer: domain ? undefined : "my_customer",
        maxResults: 50,
      });
      return NextResponse.json(res.data);
    }

    if (action === "groupMembers") {
      const groupKey = req.nextUrl.searchParams.get("groupKey")!;
      const res = await admin.members.list({
        groupKey,
        maxResults: 200,
      });
      return NextResponse.json(res.data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
