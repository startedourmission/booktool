import { NextRequest, NextResponse } from "next/server";
import { getDrive } from "@/lib/google";

export async function GET(req: NextRequest) {
  try {
    const drive = await getDrive();
    const q = req.nextUrl.searchParams.get("q") || "";
    const pageToken = req.nextUrl.searchParams.get("pageToken") || undefined;
    const pageSize = Number(req.nextUrl.searchParams.get("pageSize")) || 20;
    const orderBy = req.nextUrl.searchParams.get("orderBy") || "modifiedTime desc";

    const query = q
      ? `${q} and trashed = false`
      : "trashed = false";

    const res = await drive.files.list({
      q: query,
      pageSize,
      pageToken,
      orderBy,
      fields:
        "nextPageToken, files(id, name, mimeType, size, modifiedTime, owners, webViewLink, iconLink, thumbnailLink, parents)",
    });

    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const drive = await getDrive();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;
    const folderId = formData.get("folderId") as string | null;
    const mimeType = formData.get("mimeType") as string | null;

    if (mimeType === "application/vnd.google-apps.folder") {
      const res = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: folderId ? [folderId] : undefined,
        },
        fields: "id, name, mimeType, webViewLink",
      });
      return NextResponse.json(res.data);
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { Readable } = require("stream");
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const res = await drive.files.create({
      requestBody: {
        name: name || file.name,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: "id, name, mimeType, size, webViewLink",
    });

    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const drive = await getDrive();
    const { fileId } = await req.json();
    await drive.files.delete({ fileId });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
