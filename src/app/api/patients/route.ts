import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);

    if (!session || session.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve all patients in the database
    const patients = await db.user.findMany({
      where: { role: "PATIENT" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        appointments: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            time: true,
            reason: true,
            notes: true,
            status: true,
            chairNumber: true,
            prescriptions: true,
            invoices: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      patients,
    });
  } catch (error: any) {
    console.error("Fetch patients API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
