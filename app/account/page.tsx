"use client"
import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Signup } from "@/components/myComponents/subs"
import EditUser from "@/components/myComponents/subs/useredit"
import dynamic from 'next/dynamic'
const Login = dynamic(() => import('@/components/myComponents/subs').then((e) => e.Login), { ssr: false })
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAppContext } from "@/hooks/useAppContext"
import { ProfileImg } from "@/components/myComponents/subs/fileupload"
import { signOut } from "next-auth/react"
import UserShippingAddressForm from "@/prisma/forms/userShippingAddressForm"
import Link from "next/link"
import axios from "axios"
import { toast } from "sonner"
import { AccountUpgrade } from "@/components/myComponents/subs/AccountUpgrade"
import { AdminUserManager } from "@/components/myComponents/subs/AdminUserManager"
import { AdminBulkManager } from "@/components/myComponents/subs/AdminBulkManager"
import { AffiliateDialog } from "@/components/myComponents/subs/AffiliateDialog"
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
  CreditCard,
  Plus,
  Database,
  LayoutGrid,
  LayoutList,
  Users,
  Copy
} from "lucide-react"

const Account = () => {
  const { user, setUser } = useAppContext()
  const [cardOrientation, setCardOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [showAffiliateLinkDialog, setShowAffiliateLinkDialog] = useState(false);
  const [affiliateLinkInput, setAffiliateLinkInput] = useState("");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  useEffect(() => {
    const saved = localStorage.getItem('store-card-orientation');
    if (saved === 'vertical' || saved === 'horizontal') {
      setCardOrientation(saved);
    }
  }, []);

  useEffect(() => {
    fetch("/api/affiliate")
      .then((res) => res.json())
      .then((data) => {
        setIsAffiliate(data.isAffiliate);
        setAffiliateData(data.affiliate);
        if (!data.isAffiliate) {
          setShowAffiliateLinkDialog(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAffiliate) return;

    const fetchReferrals = async () => {
      const res = await fetch('/api/affiliate/referrals');
      const resp = await res.json();
      if (res.ok) setReferrals(resp.referrals || []);
    };

    const fetchPayouts = async () => {
      const res = await fetch('/api/affiliate/payouts');
      const resp = await res.json();
      if (res.ok) setPayouts(resp.payouts || []);
    };

    fetchReferrals();
    fetchPayouts();
  }, [isAffiliate]);

  const toggleOrientation = () => {
    const newOrientation = cardOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    setCardOrientation(newOrientation);
    localStorage.setItem('store-card-orientation', newOrientation);
  };

  const copyAffiliateId = async () => {
    if (affiliateData?.affiliateId) {
      try {
        await navigator.clipboard.writeText(affiliateData.affiliateId);
        toast.success("Affiliate ID copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy affiliate ID");
      }
    }
  };

  const copyAffiliateLink = async () => {
    if (affiliateData?.affiliateId) {
      const link = `${appUrl}?affiliate=${affiliateData.affiliateId}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Affiliate link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy affiliate link");
      }
    }
  };

  const applyAffiliateLink = async () => {
    const match = affiliateLinkInput.trim().match(/affiliate=([A-Z0-9_-]+)/i);
    if (!match) {
      toast.error("Enter a valid affiliate link");
      return;
    }

    const affiliateId = match[1];
    localStorage.setItem('healthclique_affiliate_referral', JSON.stringify({ affiliateId, timestamp: Date.now(), source: 'manual' }));
    toast.success('Affiliate link applied for your next purchase.');
    setShowAffiliateLinkDialog(false);
  };

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

        {/* ── My Health Wallet (Card) ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />
          
          <div className="relative flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-300" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Health Clique Wallet</span>
              </div>
              <CheckCircle className="h-6 w-6 text-indigo-300" />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-tighter text-indigo-200 font-black">Available Balance</p>
              <h2 className="text-4xl font-black">
                {user.walletCurrency || "₦"}
                {(user.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>

            {isAffiliate && affiliateData?.earnings != null && (
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 mt-3">
                <p className="text-xs text-indigo-200 uppercase tracking-widest font-black">Affiliate Earnings</p>
                <p className="text-xl font-bold">
                  {user.walletCurrency || "₦"}
                  {affiliateData.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-indigo-100">Total earned from referrals</p>
              </div>
            )}

            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest text-indigo-200 font-bold">Holder</p>
                <p className="text-xs font-black uppercase tracking-widest">{user.name}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 rounded-lg bg-white/20 border-white/30 hover:bg-white/30 text-[10px] font-black uppercase gap-1"
                    onClick={async () => {
                        const amount = parseFloat(prompt("Enter amount to top up:", "5000") || "0");
                        if (amount > 0) {
                            try {
                                const newBalance = (user.walletBalance || 0) + amount;
                                await axios.put(`/api/dbhandler?model=user&id=${user.id}`, { walletBalance: newBalance });
                                setUser({ ...user, walletBalance: newBalance });
                                toast.success(`₦${amount.toLocaleString()} added to your wallet!`);
                            } catch (err) {
                                toast.error("Top up failed");
                            }
                        }
                    }}
                 >
                    <Plus className="h-3 w-3" /> Top Up
                 </Button>
                 <div className="flex -space-x-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30" />
                    <div className="h-8 w-8 rounded-full bg-white/40 backdrop-blur-md border border-white/30" />
                 </div>
              </div>
            </div>
          </div>
        </div>

        {isAffiliate && (
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Affiliate Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground">Referral history</p>
                {referrals.length === 0 ? (
                  <p className="text-xs text-muted-foreground mt-2">No referrals yet</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-xs">
                    {referrals.slice(0, 8).map((r) => (
                      <li key={r.id} className="flex justify-between gap-2 items-center">
                        <span className="truncate">#{r.orderId}</span>
                        <span className="font-medium">{(r.affiliateCommission || 0).toFixed(2)}</span>
                        <Badge variant={r.status === 'paid' ? 'secondary' : 'outline'}>{r.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-3 border rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground">Payouts history</p>
                {payouts.length === 0 ? (
                  <p className="text-xs text-muted-foreground mt-2">No payout requests yet</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-xs">
                    {payouts.slice(0, 8).map((p) => (
                      <li key={p.id} className="flex justify-between gap-2 items-center">
                        <span>₦{p.amount.toFixed(2)}</span>
                        <Badge variant={p.status === 'paid' ? 'secondary' : 'outline'}>{p.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin: full user manager. Staff: nothing. Customer/Professional/Wholesaler: upgrade prompt */}
        {user.role === "admin" ? (
          <>
            <AdminBulkManager />
            <AdminUserManager />
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-muted/40 border-b">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Admin Tools</h2>
              </div>
              <div className="p-5">
                <Link href="/sheet">
                  <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                    <Database className="h-4 w-4" />
                    Data Sheet Manager
                  </Button>
                </Link>
              </div>
            </div>
          </>
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
            <EditUser />
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
        <div className="grid grid-cols-3 gap-3">
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

          {isAffiliate ? (
            <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Affiliate ID</p>
                  <p className="text-xs text-muted-foreground font-mono">{affiliateData?.affiliateId}</p>
                  <p className="text-xs text-muted-foreground mt-1">Name: {affiliateData?.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={copyAffiliateId}>Copy ID</Button>
                  <Button variant="secondary" size="sm" onClick={copyAffiliateLink}>Copy Link</Button>
                </div>
              </div>

              <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-xs">
                <p className="font-medium text-green-700">Affiliate link:</p>
                <p className="break-all text-sm">{`${appUrl}?affiliate=${affiliateData?.affiliateId}`}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold">Referral performance</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="rounded-lg border bg-white p-2">
                    <p className="text-xs text-muted-foreground">Total referrals</p>
                    <p className="text-lg font-bold">{referrals.length}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-2">
                    <p className="text-xs text-muted-foreground">Total payouts</p>
                    <p className="text-lg font-bold">{payouts.reduce((sum,e) => sum + e.amount, 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <AffiliateDialog
              onSuccess={async () => {
                try {
                  const res = await fetch("/api/affiliate");
                  const data = await res.json();
                  setIsAffiliate(data.isAffiliate);
                  setAffiliateData(data.affiliate);
                  toast.success("Affiliate program activated!");
                } catch (err) {
                  console.error(err);
                  toast.error("Could not fetch affiliate details");
                }
              }}
              trigger={
                <div className="rounded-xl border bg-card shadow-sm p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Affiliate Program</p>
                    <p className="text-xs text-muted-foreground">Earn commissions</p>
                  </div>
                </div>
              }
            />
          )}

          <Dialog open={showAffiliateLinkDialog} onOpenChange={setShowAffiliateLinkDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Enter Affiliate Link (for bonus)</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <input
                  className="w-full rounded-lg border p-2"
                  placeholder="https://yourapp.com?affiliate=AFF12345"
                  value={affiliateLinkInput}
                  onChange={(e) => setAffiliateLinkInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Use a valid affiliate URL to get a 1.5% wallet bonus on next purchase.</p>
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setShowAffiliateLinkDialog(false)}>Skip</Button>
                <Button onClick={applyAffiliateLink}>Apply</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-row gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleOrientation}
            title={`Switch to ${cardOrientation === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
            className="border-2"
          >
            {cardOrientation === 'horizontal' ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
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
                walletBalance: 0,
                walletCurrency: "₦",
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
