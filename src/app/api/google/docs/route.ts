import { NextRequest, NextResponse } from "next/server";
import { getDocs, getDrive } from "@/lib/google";

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action") || "list";

    if (action === "list") {
      const drive = await getDrive();
      const res = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.document' and trashed=false",
        pageSize: 20,
        orderBy: "modifiedTime desc",
        fields: "files(id, name, modifiedTime, webViewLink, owners)",
      });
      return NextResponse.json(res.data);
    }

    if (action === "get") {
      const docs = await getDocs();
      const documentId = req.nextUrl.searchParams.get("documentId")!;
      const res = await docs.documents.get({ documentId });
      return NextResponse.json(res.data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const docs = await getDocs();
    const { action, documentId, title, requests } = await req.json();

    if (action === "create") {
      const res = await docs.documents.create({
        requestBody: { title },
      });
      return NextResponse.json(res.data);
    }

    if (action === "update") {
      const res = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
      return NextResponse.json(res.data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
