import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "madhav-dental-clinic-super-secret-key-123456";

export interface DoctorSessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  doctorTitle?: string;
  doctorSpecialization?: string;
}

export function signToken(payload: DoctorSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): DoctorSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DoctorSessionPayload;
  } catch (error) {
    return null;
  }
}

export function getSession(req: NextRequest): DoctorSessionPayload | null {
  const tokenCookie = req.cookies.get("doctor_session")?.value;
  if (tokenCookie) {
    return verifyToken(tokenCookie);
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  return null;
}
