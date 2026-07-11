import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { signToken } from "../../../../lib/auth";
import bcrypt from "bcryptjs";

// Helper to seed doctors if they don't exist
async function seedDoctorsIfNeeded() {
  const doctorCount = await db.user.count({
    where: { role: "DOCTOR" },
  });

  if (doctorCount === 0) {
    const passwordHash = await bcrypt.hash("Password123", 10);
    
    await db.user.createMany({
      data: [
        {
          name: "Dr. Ajith Madhav",
          email: "ajith@madhavdental.com",
          phone: "+91 95674 00562",
          passwordHash,
          role: "DOCTOR",
        },
        {
          name: "Dr. Priya Nair",
          email: "priya@madhavdental.com",
          phone: "+91 95674 00563",
          passwordHash,
          role: "DOCTOR",
        },
        {
          name: "Dr. Rahul Das",
          email: "rahul@madhavdental.com",
          phone: "+91 95674 00564",
          passwordHash,
          role: "DOCTOR",
        },
      ],
      skipDuplicates: true,
    });
  }
}

export async function POST(request: Request) {
  try {
    await seedDoctorsIfNeeded();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Invalid credentials or unauthorized role" },
        { status: 401 }
      );
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Determine doctor specific details based on name
    let doctorTitle = "Dental Specialist";
    let doctorSpecialization = "General Dentistry";
    if (user.name.includes("Ajith")) {
      doctorTitle = "Founder & Chief Dental Surgeon";
      doctorSpecialization = "Oral Implantology & Laser Dentistry";
    } else if (user.name.includes("Priya")) {
      doctorTitle = "Senior Consultant";
      doctorSpecialization = "Orthodontics & Dentofacial Orthopedics";
    } else if (user.name.includes("Rahul")) {
      doctorTitle = "Consultant Surgeon";
      doctorSpecialization = "Oral & Maxillofacial Surgery";
    }

    // Sign session token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      doctorTitle,
      doctorSpecialization,
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorTitle,
        doctorSpecialization,
      },
    });

    response.cookies.set({
      name: "doctor_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
