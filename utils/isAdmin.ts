import { getServerSession } from "next-auth";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import path from "path";
import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";

const HARDCODED_ADMIN = "christopher.ridgley@gmail.com";

export async function requireAdmin(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!email) return false;

  // Load admins.json if it exists
  let admins: string[] = [];
  try {
    const adminsPath = path.join(process.cwd(), "data", "admins.json");
    admins = JSON.parse(fs.readFileSync(adminsPath, "utf8"));
  } catch {
    // ignore if file does not exist
  }
  return email === HARDCODED_ADMIN || admins.includes(email);
}
