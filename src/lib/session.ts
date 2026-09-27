// Ký / đọc phiên đăng nhập (JWT trong cookie httpOnly). Dùng được cả ở middleware.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bds_session";
export type SessionUser = {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "VILLAGE";
  villageId: number | null;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("Thiếu AUTH_SECRET (>= 16 ký tự) trong file .env");
  return new TextEncoder().encode(s);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
