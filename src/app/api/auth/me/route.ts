import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);

    if (!session || session.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user still exists in database
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user || user.role !== "DOCTOR") {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        doctorTitle: session.doctorTitle,
        doctorSpecialization: session.doctorSpecialization,
      },
    });
  } catch (error) {
    console.error("Auth Me API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
