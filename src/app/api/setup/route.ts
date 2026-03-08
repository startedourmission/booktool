import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import path from "path";

const ENV_PATH = path.join(process.cwd(), ".env");

export async function GET() {
  const configured =
    !!process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID !== "your-client-id.apps.googleusercontent.com" &&
    !!process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_SECRET !== "your-client-secret";

  return NextResponse.json({ configured });
}

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientSecret } = await req.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID와 Client Secret을 모두 입력하세요" },
        { status: 400 }
      );
    }

    const nextauthSecret = randomBytes(32).toString("base64");

    const envContent = `# Google OAuth Credentials
GOOGLE_CLIENT_ID=${clientId}
GOOGLE_CLIENT_SECRET=${clientSecret}

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${nextauthSecret}
`;

    writeFileSync(ENV_PATH, envContent, "utf-8");

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
