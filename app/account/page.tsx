"use client"
import { motion } from "framer-motion"
import { Signup } from "@/components/myComponents/subs"
import EditUser from "@/components/myComponents/subs/useredit"
import dynamic from 'next/dynamic'
const Login = dynamic(() => import('@/components/myComponents/subs').then((e) => e.Login), { ssr: false })
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAppContext } from "@/hooks/useAppContext"
import { ProfileImg } from "@/components/myComponents/subs/fileupload"
import { signOut } from "next-auth/react"
import UserShippingAddressForm from "@/prisma/forms/userShippingAddressForm"
import Link from "next/link"
import { AccountUpgrade } from "@/components/myComponents/subs/AccountUpgrade"
import { AdminUserManager } from "@/components/myComponents/subs/AdminUserManager"
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Heart,
  LogOut,
  Shield,
  Building,
  Clock,
  Briefcase,
  Building2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

const Account = () => {
  const { user, setUser } = useAppContext()

  if (user.name === "visitor" && user.email === "nil") {
    return (
      <div className="min-h-[60vh] w-full flex flex-col justify-center items-center gap-6 px-4">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">You're not signed in</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Sign in to view your profile, orders, wishlist and more.
          </p>
        </div>
        <div className="flex flex-row gap-3">
          <Login />
          <Signup />
        </div>
      </div>
    )
  }

  const avatarSrc =
    user.avatarUrl && user.avatarUrl !== ""
      ? user.avatarUrl
      : user.image && user.image !== ""
        ? user.image
        : "https://res.cloudinary.com/dc5khnuiu/image/upload/v1752627019/uxokaq0djttd7gsslwj9.png"

  const primaryAddress = user.addresses?.[0]

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }}
      className="w-full min-h-full"
    >
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* ── Avatar & Hero ── */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-lg">
              <img src={avatarSrc} alt={user.name || "User"} className="w-full h-full object-cover" />
            </div>
            <ProfileImg />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">{user.name || "—"}</h1>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize text-xs">
                  {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                  {user.role || "customer"}
                </Badge>
                {user.verificationStatus === "verified" && (
                  <Badge variant="outline" className="text-[10px] border-green-500 text-green-600 bg-green-50 py-0 h-5">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {user.verificationStatus === "pending" && (
                  <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600 bg-amber-50 py-0 h-5">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Admin: full user manager. Staff: nothing. Customer/Professional/Wholesaler: upgrade prompt */}
        {user.role === "admin" ? (
          <AdminUserManager />
        ) : user.role === "customer" ? (
          <AccountUpgrade />
        ) : null}

        <Separator />

        {/* ── Profile Info Card ── */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-muted/40 border-b">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profile Information</h2>
          </div>

          <div className="divide-y">
            {/* Email */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{user.email || "—"}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="text-sm font-medium">{user.contact || "Not set"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Professional Details (If any) ── */}
        {user.role === "professional" && (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden border-primary/20">
            <div className="px-5 py-3 bg-primary/10 border-b flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">Professional Details</h2>
            </div>
            <div className="divide-y">
              <div className="px-5 py-3 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Specialization</span>
                <span className="font-medium capitalize">{user.professionalType || "—"}</span>
              </div>
              <div className="px-5 py-3 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Reg Number</span>
                <span className="font-medium">{user.regNumber || "—"}</span>
              </div>
              {user.licenseImage && (
                <div className="px-5 py-3 flex flex-col gap-2">
                  <span className="text-muted-foreground text-sm font-medium">Practice License</span>
                  <div className="w-full aspect-video rounded-lg overflow-hidden border">
                    <img src={user.licenseImage} alt="License" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Wholesaler Details (If any) ── */}
        {user.role === "wholesaler" && (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden border-primary/20">
            <div className="px-5 py-3 bg-primary/10 border-b flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">Facility Details</h2>
            </div>
            <div className="divide-y">
              <div className="px-5 py-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Facility Name</span>
                <span className="text-sm font-medium">{user.facilityName || "—"}</span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Address</span>
                <span className="text-sm font-medium">{user.facilityAddress || "—"}</span>
              </div>
              <div className="px-5 py-3 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Registration No</span>
                <span className="font-medium">{user.facilityRegNumber || "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Shipping Address Card ── */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-muted/40 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Shipping Address</h2>
          </div>

          {primaryAddress ? (
            <div className="divide-y">
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Primary Address</p>
                  <p className="text-sm font-medium">
                    {[primaryAddress.address, primaryAddress.city, primaryAddress.state, primaryAddress.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {primaryAddress.zip && (
                    <p className="text-xs text-muted-foreground mt-0.5">ZIP: {primaryAddress.zip}</p>
                  )}
                  {primaryAddress.phone && (
                    <p className="text-xs text-muted-foreground mt-0.5">📞 {primaryAddress.phone}</p>
                  )}
                </div>
              </div>

              {/* Additional addresses */}
              {user.addresses && user.addresses.length > 1 && user.addresses.slice(1).map((addr, i) => (
                <div key={addr.id || i} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Address {i + 2}</p>
                    <p className="text-sm font-medium">
                      {[addr.address, addr.city, addr.state, addr.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No shipping address added yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Edit your profile to add one</p>
            </div>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/wishlist">
            <div className="rounded-xl border bg-card shadow-sm p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center">
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Wishlist</p>
                <p className="text-xs text-muted-foreground">Saved items</p>
              </div>
            </div>
          </Link>

          <Link href="/orders">
            <div className="rounded-xl border bg-card shadow-sm p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Orders</p>
                <p className="text-xs text-muted-foreground">Purchase history</p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-row gap-3">
          <Button
            className="flex-1 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
            variant="outline"
            onClick={() => {
              signOut({ callbackUrl: "/" })
              setUser({
                name: "visitor",
                id: "nil",
                email: "nil",
                avatarUrl: "https://res.cloudinary.com/dc5khnuiu/image/upload/v1752627019/uxokaq0djttd7gsslwj9.png",
                role: "customer",
                contact: "xxxx",
              })
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <EditUser />
        </div>

      </div>
    </motion.section>
  )
}

export default Account
