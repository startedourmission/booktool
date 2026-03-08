import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getGoogleClient() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    throw new Error("Not authenticated");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: (session as any).accessToken,
  });

  return oauth2Client;
}

export async function getDrive() {
  const auth = await getGoogleClient();
  return google.drive({ version: "v3", auth });
}

export async function getGmail() {
  const auth = await getGoogleClient();
  return google.gmail({ version: "v1", auth });
}

export async function getCalendar() {
  const auth = await getGoogleClient();
  return google.calendar({ version: "v3", auth });
}

export async function getSheets() {
  const auth = await getGoogleClient();
  return google.sheets({ version: "v4", auth });
}

export async function getDocs() {
  const auth = await getGoogleClient();
  return google.docs({ version: "v1", auth });
}

export async function getChat() {
  const auth = await getGoogleClient();
  return google.chat({ version: "v1", auth });
}

export async function getAdmin() {
  const auth = await getGoogleClient();
  return google.admin({ version: "directory_v1", auth });
}
