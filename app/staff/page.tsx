"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { BadgeCheck, CircleAlert, Loader2, LockKeyhole, UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type CreatedUser = { id: string; name: string; email: string; role: string; contact?: string | null; createdAt: string }

export default function StaffSignupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const canCreateUsers = session?.user?.role === "admin" || session?.user?.role === "staff"
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [contact, setContact] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null)

  const createAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setCreatedUser(null)
    try {
      const response = await fetch("/api/staff/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, contact }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Unable to create account")
      setCreatedUser(result.user)
      setName("")
      setEmail("")
      setContact("")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create account")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading") return <main className="p-6 text-muted-foreground">Checking access…</main>
  if (!canCreateUsers) return <main className="mx-auto max-w-3xl p-6"><section className="rounded-3xl border bg-card p-8 text-center"><LockKeyhole className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h1 className="text-2xl font-bold">Staff access required</h1><p className="mt-2 text-sm text-muted-foreground">Only staff and administrators can create customer accounts here.</p><Button className="mt-5" variant="outline" onClick={() => router.push("/")}>Return home</Button></section></main>

  return <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-6 lg:p-8">
    <header className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 sm:p-9">
      <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"><Users className="h-3.5 w-3.5" /> Staff tools</div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Register a customer</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">Create a customer account directly in HealthClique. Their saved account name will be available in Sales and Vitals search.</p></div>
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg"><UserPlus className="h-8 w-8" /></div>
      </div>
    </header>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={createAccount} className="space-y-5 rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
        <div><h2 className="text-xl font-semibold">Customer details</h2><p className="text-sm text-muted-foreground">Name and email are required. Phone number is optional.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="signup-name">Full name</Label><Input id="signup-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Customer's full name" minLength={2} maxLength={120} required /></div>
          <div className="space-y-2"><Label htmlFor="signup-email">Email address</Label><Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required /></div>
          <div className="space-y-2"><Label htmlFor="signup-contact">Phone number <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="signup-contact" type="tel" autoComplete="tel" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="080…" /></div>
        </div>
        {error ? <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
        {createdUser ? <div role="status" className="space-y-1 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm"><p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300"><BadgeCheck className="h-4 w-4" />Account created</p><p>{createdUser.name} · {createdUser.email}</p><p>Temporary password: <strong className="select-all">password</strong></p></div> : null}
        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => { setName(""); setEmail(""); setContact(""); setError(""); setCreatedUser(null) }}>Clear form</Button><Button type="submit" disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}{saving ? "Creating account…" : "Create customer account"}</Button></div>
      </form>

      <aside className="h-fit space-y-4 rounded-3xl border bg-muted/25 p-5 sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><LockKeyhole className="h-5 w-5" /></div>
        <div><h2 className="font-semibold">Default sign-in details</h2><p className="mt-1 text-sm text-muted-foreground">All accounts created by staff receive the same initial password.</p></div>
        <div className="rounded-xl border bg-background p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Temporary password</p><p className="mt-1 select-all font-mono text-xl font-bold">password</p></div>
        <p className="text-xs leading-relaxed text-muted-foreground">Tell the customer to sign in with the email address above and change the temporary password after their first login. Account access is limited to the customer role.</p>
      </aside>
    </div>
  </main>
}
