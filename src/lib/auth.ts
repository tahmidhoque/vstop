import "server-only";

import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { PasswordType } from "@/generated/enums";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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
  cookieStore.set(SESSION_COOKIE_NAME, type, {
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
  return (session?.value as PasswordType) || null;
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
