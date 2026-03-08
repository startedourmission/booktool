import { NextRequest, NextResponse } from "next/server";
import { getCalendar } from "@/lib/google";

export async function GET(req: NextRequest) {
  try {
    const calendar = await getCalendar();
    const action = req.nextUrl.searchParams.get("action") || "list";

    if (action === "calendars") {
      const res = await calendar.calendarList.list();
      return NextResponse.json(res.data);
    }

    const calendarId =
      req.nextUrl.searchParams.get("calendarId") || "primary";
    const timeMin =
      req.nextUrl.searchParams.get("timeMin") ||
      new Date().toISOString();
    const timeMax =
      req.nextUrl.searchParams.get("timeMax") ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });

    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const calendar = await getCalendar();
    const { calendarId = "primary", summary, description, start, end, attendees, location } =
      await req.json();

    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description,
        location,
        start: { dateTime: start, timeZone: "Asia/Seoul" },
        end: { dateTime: end, timeZone: "Asia/Seoul" },
        attendees: attendees
          ? attendees.split(",").map((e: string) => ({ email: e.trim() }))
          : undefined,
      },
    });

    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const calendar = await getCalendar();
    const { calendarId = "primary", eventId, summary, description, start, end, location } =
      await req.json();

    const res = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary,
        description,
        location,
        start: { dateTime: start, timeZone: "Asia/Seoul" },
        end: { dateTime: end, timeZone: "Asia/Seoul" },
      },
    });

    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const calendar = await getCalendar();
    const { calendarId = "primary", eventId } = await req.json();
    await calendar.events.delete({ calendarId, eventId });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
