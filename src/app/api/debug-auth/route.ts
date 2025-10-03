import { authOptions } from "@/shared/lib/auth-config";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      session: session
        ? {
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              role: session.user.role,
            },
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get session",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
