import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { db } from "../../../../lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSession(request);

    if (!session || session.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes, chairNumber } = body;

    // Verify appointment exists
    const appointment = await db.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Build update object
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (chairNumber !== undefined) updateData.chairNumber = chairNumber;

    if (status === "COMPLETED") {
      updateData.doctorName = session.name;
      updateData.doctorId = session.userId;
    }

    // Update appointment
    const updatedAppointment = await db.appointment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error: any) {
    console.error("Update appointment API Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
