"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/hooks/useAppContext";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TermsAgreements } from "@/components/myComponents/subs/TermsAgreements";
import axios from "axios";

const TermsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAppContext();
  const applyCredit = searchParams.get("applyCredit") === "true";
  
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);

  const checkEligibility = async () => {
    if (!user || user.email === "nil") return;
    setLoading(true);
    try {
      // Logic for eligibility:
      // 1. Fetch user's cart history
      const res = await axios.get(`/api/dbhandler?model=cart&userId=${user.id}`);
      const carts = res.data;
      
      const completedCarts = carts.filter((c: any) => c.status === "completed" || c.status === "delivered");
      const totalLifetimeSales = completedCarts.reduce((acc: number, c: any) => acc + c.total, 0);
      const transactionCount = carts.length;
      
      const newReasons = [];
      if (totalLifetimeSales < 1000000) newReasons.push(`Total lifetime sales (${totalLifetimeSales.toLocaleString()} NGN) is below 1,000,000 NGN threshold.`);
      if (transactionCount < 5) newReasons.push(`Total transaction count (${transactionCount}) is below 5 orders.`);
      if (completedCarts.length < 3) newReasons.push(`Completed transactions (${completedCarts.length}) is below 3 required.`);
      
      setReasons(newReasons);
      setIsEligible(newReasons.length === 0);
    } catch (err) {
      toast.error("Failed to verify eligibility history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applyCredit) {
      checkEligibility();
    }
  }, [applyCredit, user?.id]);

  const handleApply = async () => {
    if (!agreed) return toast.error("You must agree to the terms first.");
    toast.success("Credit Facility Application Submitted! Our team will review your history and contact you shortly.");
    setTimeout(() => router.push("/cart"), 2000);
  };

  return (
    <div className="container mx-auto py-20 px-4 max-w-4xl min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <section className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tighter">Terms & <span className="text-primary italic">Conditions</span></h1>
          <p className="text-muted-foreground font-medium">Last updated: February 23, 2026</p>
        </section>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section className="bg-card p-8 rounded-3xl border shadow-sm space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-primary">1. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>You are at least 18 years old, or are using the Platform under the supervision of a parent or legal guardian</li>
                <li>You have the legal capacity to enter into a binding agreement</li>
                <li>All information you provide is accurate, current, and complete</li>
              </ul>
              <p className="mt-4 text-muted-foreground italic">We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion.</p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 text-primary">2. Nature of Services</h2>
              <p className="text-muted-foreground mb-4">Healthclique Limited provides a technology-enabled pharmaceutical access platform that facilitates:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Prescription fulfillment</li>
                <li>Medication sourcing and supply</li>
                <li>Healthcare product distribution</li>
                <li>Logistics coordination for doorstep delivery</li>
              </ul>
              <p className="font-semibold text-destructive">We do not replace your healthcare provider. All medical advice, diagnosis, and prescriptions must originate from a licensed healthcare professional.</p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 text-primary">3. User Responsibilities & Prescription Policy</h2>
              <p className="text-muted-foreground mb-4">You agree that you will:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Provide valid and authentic prescriptions issued by licensed practitioners</li>
                <li>Use the Platform only for lawful purposes</li>
                <li>Not misuse, duplicate, or fraudulently alter prescriptions</li>
                <li>Not attempt to gain unauthorized access to our systems</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                Prescription-only medications will only be dispensed upon receipt and validation of a legitimate prescription. We may contact prescribing practitioners or regulatory bodies for verification. Suspicious, altered, or expired prescriptions will be rejected. 
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 text-primary">4. Orders, Payments and Fulfillment</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>All orders are subject to availability and regulatory clearance.</li>
                <li>Prices displayed are subject to change without notice. Payments must be made through approved channels.</li>
                <li>We do not store sensitive payment details; transactions are handled by third-party processors.</li>
                <li>We reserve the right to cancel or modify orders due to stock limitations, legal restrictions, or safety concerns.</li>
                <li>Estimated delivery timelines are indicative and not guaranteed.</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h2 className="text-2xl font-bold mb-4 text-primary">5. AI-Powered Features & Third Parties</h2>
              <p className="text-muted-foreground mb-4">
                Our Platform integrates with third-party providers (Logistics, Payment processors). Healthclique Limited does not control and assumes no liability for the actions, omissions, or service quality of these third parties.
              </p>
              <p className="text-muted-foreground mb-4">
                Our Platform may utilize artificial intelligence (AI) to assist with prescription processing and order management. You acknowledge that AI outputs are assistive and not a substitute for professional judgment.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h2 className="text-2xl font-bold mb-4 text-primary">6. Returns, Refunds & Delivery</h2>
              <p className="text-muted-foreground mb-4">
                Due to the sensitive nature of pharmaceutical products, medicines are generally non-returnable once dispensed. Refunds may only be issued in cases of incorrect delivery, damaged products, or verified fulfillment errors.
              </p>
              <p className="text-muted-foreground">
                Deliveries are made to the address provided. Users must ensure availability. Identification may be required upon delivery.
              </p>
            </div>
            <div className="pt-6">
              <TermsAgreements />
            </div>
          </section>


          <section className="bg-primary/5 p-8 rounded-3xl border border-primary/20 ring-1 ring-primary/10">
            <h2 className="text-2xl font-bold mb-4 text-primary flex items-center gap-2">

              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
              Credit Facility (Wholesale Only)
            </h2>
            <p className="font-bold mb-4">The following strict criteria must be met to be eligible for our Credit Facility:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-xl border">
                <span className="block font-black text-primary text-xs uppercase mb-1">Threshold</span>
                Orders below 200,000 NGN must be Cash and Carry. No credit allowed.
              </div>
              <div className="bg-background p-4 rounded-xl border">
                <span className="block font-black text-primary text-xs uppercase mb-1">History</span>
                Must have an overall lifetime sales record worth at least 1,000,000 NGN.
              </div>
              <div className="bg-background p-4 rounded-xl border">
                <span className="block font-black text-primary text-xs uppercase mb-1">Consistency</span>
                Must have completed at least 5 transactions within a 1-month timeframe since registration.
              </div>
              <div className="bg-background p-4 rounded-xl border">
                <span className="block font-black text-primary text-xs uppercase mb-1">Engagement</span>
                A minimum of 3 separate order cycles must be completed before eligibility.
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="font-bold border-b pb-2">Credit Sales Terms:</h3>
              <ul className="space-y-3 text-sm italic">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">✓</span>
                  For shipment to be initiated, at least 50% (half) of the total order value must be paid upfront.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">✓</span>
                  Balance (remaining 50%) must be paid immediately upon successful receipt and verification of the products.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">✓</span>
                  Custom terms may be negotiated for special large-scale wholesale partnerships.
                </li>
              </ul>
            </div>
          </section>

          {/* APPLICATION SECTION */}
          {applyCredit && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border-2 border-primary p-8 rounded-[2rem] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle size={120} className="text-primary" />
              </div>
              
              <h2 className="text-3xl font-black mb-6">Credit <span className="text-primary italic">Application</span></h2>
              
              <div className="space-y-6 relative z-10">
                <div className="p-4 bg-muted/50 rounded-2xl border flex items-start gap-4">
                  {loading ? (
                    <Loader2 className="animate-spin text-primary" />
                  ) : isEligible ? (
                    <CheckCircle className="text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="text-amber-500 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold">Eligibility Status</h4>
                    <p className="text-sm opacity-70">
                      {loading ? "Analyzing your transaction history..." : 
                       isEligible ? "Congratulations! You meet our primary eligibility criteria." : 
                       "Unfortunately, you do not meet all criteria for an automated credit facility application."}
                    </p>
                    {!loading && reasons.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {reasons.map((r, i) => (
                          <li key={i} className="text-xs text-destructive flex gap-2">
                            <span>×</span> {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="agree" 
                    className="w-5 h-5 accent-primary"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <label htmlFor="agree" className="text-sm font-medium cursor-pointer">
                    I have read and agree to all terms of the Credit Facility.
                  </label>
                </div>

                <Button 
                  onClick={handleApply} 
                  disabled={!agreed || loading || isEligible === false}
                  className="w-full h-14 text-lg font-black rounded-2xl shadow-lg shadow-primary/20"
                >
                  {isEligible === false ? "Ineligible for Credit" : "Submit Credit Application"}
                </Button>
              </div>
            </motion.section>
          )}

          <section className="text-center py-10">
            <p className="text-xs text-muted-foreground italic">
              Health Clique reserves the right to withdraw credit facilities from any institution or wholesaler without prior notice if terms are violated.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsPage;
