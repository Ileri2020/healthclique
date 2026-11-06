import { auth } from "@/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

const isLocalhost = (host: string | null) => {
  if (!host) return false
  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase()
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  } catch {
    return false
  }
}

export async function requireInventoryPageAccess(adminOnly = false) {
  if (isLocalhost((await headers()).get("host"))) return

  const session = await auth()
  const role = session?.user?.role?.trim().toLowerCase()
  if (adminOnly ? role !== "admin" : role !== "admin" && role !== "staff") redirect("/home")
}