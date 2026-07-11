import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);

    if (!session || session.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterSelf = searchParams.get("self") === "true";

    // Build filter query
    const where: any = {};
    if (filterSelf) {
      // Map based on doctor slug or name
      const doctorSlug = session.name.toLowerCase().includes("ajith")
        ? "dr-ajith-madhav"
        : session.name.toLowerCase().includes("priya")
        ? "dr-priya-nair"
        : "dr-rahul-das";
      where.doctorId = doctorSlug;
    }

    // Retrieve appointments including patient names
    const appointments = await db.appointment.findMany({
      where,
      orderBy: [
        { date: "asc" },
        { time: "asc" }
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        prescriptions: true,
        invoices: true,
      },
    });

    return NextResponse.json({
      success: true,
      appointments,
    });
  } catch (error: any) {
    console.error("Fetch appointments API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
