"use client";

import React from "react";
import { motion } from "framer-motion";

const TermsPage = () => {
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
          <section className="bg-muted/30 p-8 rounded-3xl border border-border/50">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              General Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By using Health Clique, you agree to comply with and be bound by the following terms and conditions of use. 
              These terms govern the relationship between Health Clique and its customers (individual and wholesale).
            </p>
          </section>

          <section className="bg-muted/30 p-8 rounded-3xl border border-border/50">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Purchase & Shipping
            </h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Individual Customers:</strong> Shipping is provided for all individual retail orders.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Wholesale/Professional Buyers:</strong> Shipping may be restricted if the order volume is small or if the delivery location is outside our standard logistics range.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Personal Supply:</strong> We personally supply and deliver directly for verified wholesalers to ensure quality and safety.</span>
              </li>
            </ul>
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
