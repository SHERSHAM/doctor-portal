import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);

    if (!session || session.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId, medicines, instructions } = await request.json();

    if (!appointmentId || !medicines) {
      return NextResponse.json(
        { error: "Appointment ID and medicines are required" },
        { status: 400 }
      );
    }

    // Verify appointment exists
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Create prescription in database
    const prescription = await db.prescription.create({
      data: {
        appointmentId,
        medicines: typeof medicines === "string" ? medicines : JSON.stringify(medicines),
        instructions,
        signedBy: session.name,
      },
    });

    return NextResponse.json({
      success: true,
      prescription,
    });
  } catch (error: any) {
    console.error("Create prescription API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
