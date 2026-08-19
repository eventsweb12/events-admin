import { comparePassword, signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request) {
  const { username, password } = await request.json();

  console.log("--- LOGIN DEBUG ---");
  console.log("received username:", JSON.stringify(username));
  console.log("expected username:", JSON.stringify(process.env.ADMIN_USERNAME));
  console.log("received password:", JSON.stringify(password));
  console.log("stored hash:", process.env.ADMIN_PASSWORD_HASH);

  if (username !== process.env.ADMIN_USERNAME) {
    console.log("❌ username mismatch");
    return Response.json({ error: "არასწორი მონაცემები" }, { status: 401 });
  }

  const isValid = await comparePassword(password, process.env.ADMIN_PASSWORD_HASH);
  console.log("password match result:", isValid);

  if (!isValid) {
    console.log("❌ password mismatch");
    return Response.json({ error: "არასწორი მონაცემები" }, { status: 401 });
  }

  const token = signToken({ username });

  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return Response.json({ success: true });
}