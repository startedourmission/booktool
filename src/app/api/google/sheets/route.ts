import { NextRequest, NextResponse } from "next/server";
import { getSheets, getDrive } from "@/lib/google";

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action") || "list";

    if (action === "list") {
      const drive = await getDrive();
      const res = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
        pageSize: 20,
        orderBy: "modifiedTime desc",
        fields: "files(id, name, modifiedTime, webViewLink, owners)",
      });
      return NextResponse.json(res.data);
    }

    if (action === "get") {
      const sheets = await getSheets();
      const spreadsheetId = req.nextUrl.searchParams.get("spreadsheetId")!;
      const res = await sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false,
      });
      return NextResponse.json(res.data);
    }

    if (action === "values") {
      const sheets = await getSheets();
      const spreadsheetId = req.nextUrl.searchParams.get("spreadsheetId")!;
      const range = req.nextUrl.searchParams.get("range") || "Sheet1";
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
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
    const sheets = await getSheets();
    const { action, spreadsheetId, title, range, values } = await req.json();

    if (action === "create") {
      const res = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title },
        },
      });
      return NextResponse.json(res.data);
    }

    if (action === "append") {
      const res = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });
      return NextResponse.json(res.data);
    }

    if (action === "update") {
      const res = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });
      return NextResponse.json(res.data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
