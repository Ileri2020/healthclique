"use client";

import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Clock, ShieldCheck, HeartPulse, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import landingimg from '@/public/pharmacist.png'
import { GlobalSearch } from "./index";

const Hero = () => {


  return (
    <div className="relative bg-background">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[length:20px_20px]" />
      <div className="absolute top-0 right-0 -tr-y-1/2 w-1/3 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      
      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Text & Search */}
          <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <ShieldCheck className="w-4 h-4" />
                NAFDAC Approved Pharmacy
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-[1.1]">
                With a click, get your <br />
                <span className="text-accent text-4xl md:text-5xl underline decoration-accent/30">Premium Medical Supplies</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                Order authentic medications, pharmaceutical products, and medical equipment at the lowest prices, delivered to your doorstep.
              </p>
            </div>

            {/* Instant Search Bar (OneHealth Replication) */}
            <div className="relative w-full max-w-lg">
                <GlobalSearch 
                  placeholder="Search for medications, brands or ingredients..." 
                  className="h-14"
                />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/store">
                <Button size="lg" className="h-14 px-8 rounded-xl text-lg bg-accent hover:bg-accent/90">
                  Shop All Meds
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl text-lg gap-2 border-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                WhatsApp Order
              </Button>
            </div>

            {/* Value Badges */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 text-primary" />
                <span>Doorstep Delivery (1-4 hrs)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <HeartPulse className="w-5 h-5 text-primary" />
                <Link href="/contact" className="hover:text-primary transition-colors">Talk to a Pharmacist</Link>
              </div>
            </div>
          </div>

          {/* Right Column: Visuals */}
          <div className="relative hidden lg:block animate-in fade-in slide-in-from-right duration-700">
            <div className="relative aspect-square w-full max-w-lg mx-auto overflow-hidden rounded-3xl border-8 border-background shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
               <Image
                src={landingimg}
                alt="Expert Pharmacist"
                fill
                className="object-cover scale-110 hover:scale-100 transition-transform duration-700"
                priority
              />
            </div>
            
            {/* Float Cards */}
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl border animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Quality Guaranteed</div>
                  <div className="text-sm font-bold">100% Authentic</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Action Floating Widget */}
      <div className="fixed left-6 bottom-24 z-50 flex flex-col gap-2">
        <a href="tel:+2348188762448" className="bg-primary text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group">
          <Phone className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium whitespace-nowrap">Call to Order</span>
        </a>
      </div>

    </div>
  );
};

export default Hero;