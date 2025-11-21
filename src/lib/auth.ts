import "server-only";

import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { PasswordType } from "@/generated/enums";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 15; // 15 minutes

interface SessionData {
  type: PasswordType;
  createdAt: number; // Unix timestamp in milliseconds
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return compare(password, hash);
}

export async function createSession(type: PasswordType): Promise<void> {
  const cookieStore = await cookies();
  const sessionData: SessionData = {
    type,
    createdAt: Date.now(),
  };
  
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<PasswordType | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!session?.value) {
    return null;
  }

  try {
    const sessionData: SessionData = JSON.parse(session.value);
    const now = Date.now();
    const sessionAge = now - sessionData.createdAt;
    const maxAgeMs = SESSION_MAX_AGE * 1000;

    // Check if session is expired (older than 15 minutes)
    if (sessionAge > maxAgeMs) {
      // Session expired - return null (cookie will expire naturally via maxAge)
      return null;
    }

    return sessionData.type;
  } catch (error) {
    // Invalid session data - return null (cookie will expire naturally via maxAge)
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function verifyCustomerPassword(
  password: string,
): Promise<boolean> {
  const passwordRecord = await db.password.findUnique({
    where: { type: "CUSTOMER" },
  });

  if (!passwordRecord) {
    return false;
  }

  return verifyPassword(password, passwordRecord.passwordHash);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const passwordRecord = await db.password.findUnique({
    where: { type: "ADMIN" },
  });

  if (!passwordRecord) {
    return false;
  }

  return verifyPassword(password, passwordRecord.passwordHash);
}

export async function updateCustomerPassword(
  newPassword: string,
): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);

  await db.password.upsert({
    where: { type: "CUSTOMER" },
    update: { passwordHash: hashedPassword },
    create: {
      type: "CUSTOMER",
      passwordHash: hashedPassword,
    },
  });
}
