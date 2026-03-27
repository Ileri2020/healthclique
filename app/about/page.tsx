"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, HeartPulse, BrainCircuit, Activity, Pill, Users, Building, MapPin, Truck } from "lucide-react";

import Countup from "react-countup";
import Stats from "@/data/stats";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const chartData = [
  { name: "Jan", prescriptions: 400 },
  { name: "Feb", prescriptions: 600 },
  { name: "Mar", prescriptions: 1000 },
  { name: "Apr", prescriptions: 1400 },
  { name: "May", prescriptions: 2500 },
  { name: "Jun", prescriptions: 4000 },
  { name: "Jul", prescriptions: 7200 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const About = () => {
  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 md:px-8">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={staggerContainer}
        className="max-w-5xl mx-auto space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={fadeUp} className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-4 py-1 text-sm border-primary/30 text-primary">About Us</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Healthclique <span className="text-primary">Limited</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We believe that access to safe, effective, and affordable medicines should never be a privilege—it should be a standard. We are a forward-thinking healthcare company dedicated to solving the complex challenges surrounding medicine access in Nigeria and across underserved African communities.
          </p>
        </motion.div>

        {/* Who We Are & Vision Combo */}
        <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-6">
          <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-2xl">Who We Are</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              Healthclique Limited is owned and managed by licensed Pharmacists with deep expertise in pharmaceutical care, supply chain management, and patient-centered service delivery. We operate in full compliance with all regulatory requirements governing the pharmaceutical sector, ensuring that every product and service we provide meets the highest standards of safety, quality, and authenticity.
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-indigo-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <HeartPulse className="h-8 w-8 text-indigo-500 mb-2" />
              <CardTitle className="text-2xl">Our Vision & Promise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>Vision:</strong> To become Africa’s most trusted digital healthcare platform, transforming how medicines are accessed and delivered—one community at a time.
              </p>
              <p>
                <strong>Promise:</strong> From the moment you place an order to the time it arrives at your doorstep, we are committed to delivering a smooth, secure, and memorable experience. At Healthclique Limited, your health is not just our business—it is our purpose.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ----- COUNTUP STATS SECTION ----- */}
        <motion.div variants={fadeUp} className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Stats.stats.map((stat, index) => (
              <div key={index} className="bg-card border rounded-2xl p-6 shadow-sm text-center flex flex-col justify-center items-center hover:shadow-md transition-all">
                <Countup 
                  end={stat.num}
                  duration={4}
                  delay={0.5}
                  separator=","
                  enableScrollSpy={true}
                  scrollSpyDelay={100}
                  scrollSpyOnce={true}
                  className="text-4xl md:text-5xl font-black text-primary mb-2"
                />
                <div className="text-sm font-semibold text-muted-foreground">{stat.text}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <Separator />

        {/* What We Do Section */}
        <motion.div variants={fadeUp} className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">What We Do</h2>
            <p className="text-muted-foreground">
              We leverage a holistic, technology-driven approach to bridge the gap between patients, healthcare professionals, and essential medicines. Our robust platform is designed to serve:
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6">
             <Card className="bg-background/60 backdrop-blur-sm border-primary/10">
               <CardHeader className="text-center pb-2">
                 <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                   <Users className="h-6 w-6 text-primary" />
                 </div>
                 <CardTitle className="text-lg">Individuals & Families</CardTitle>
               </CardHeader>
               <CardContent className="text-center text-sm text-muted-foreground">
                 Who need to conveniently fill prescriptions safely and affordably.
               </CardContent>
             </Card>

             <Card className="bg-background/60 backdrop-blur-sm border-primary/10">
               <CardHeader className="text-center pb-2">
                 <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                   <Activity className="h-6 w-6 text-primary" />
                 </div>
                 <CardTitle className="text-lg">Healthcare Professionals</CardTitle>
               </CardHeader>
               <CardContent className="text-center text-sm text-muted-foreground">
                 Sourcing authentic medications for personal use or for their patients.
               </CardContent>
             </Card>

             <Card className="bg-background/60 backdrop-blur-sm border-primary/10">
               <CardHeader className="text-center pb-2">
                 <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                   <Building className="h-6 w-6 text-primary" />
                 </div>
                 <CardTitle className="text-lg">Organizations</CardTitle>
               </CardHeader>
               <CardContent className="text-center text-sm text-muted-foreground">
                 Institutions requiring bulk or highly specialized medicine supply.
               </CardContent>
             </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            <Card className="bg-primary/5 border-primary/20 h-full">
              <CardContent className="flex flex-col items-start gap-4 p-8 h-full justify-center">
                <div className="bg-primary/10 p-4 rounded-full">
                  <BrainCircuit className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">AI-Powered System</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    With our advanced AI-powered system, accessing medications has never been easier. Simply upload your prescription or request, and our intelligent platform handles verification, sourcing, and fulfillment—delivering a seamless, stress-free experience from start to finish.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ----- GRAPHS SECTION ----- */}
            <Card className="border shadow-sm h-full flex flex-col">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Our Growth Impact (2026)</CardTitle>
                <CardDescription>Monthly Prescriptions Processed</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4 pt-4 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFills" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="prescriptions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFills)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Quality & Integrity */}
        <motion.div variants={fadeUp} className="bg-card border rounded-2xl p-8 shadow-sm">

           <div className="flex flex-col md:flex-row gap-10">
             <div className="md:w-1/3 space-y-4">
               <ShieldCheck className="h-12 w-12 text-primary" />
               <h2 className="text-2xl font-bold">Commitment to Quality & Integrity</h2>
               <p className="text-muted-foreground text-sm">
                 Integrity is the foundation of everything we do. Our mission aligns closely with the Nigerian National Drug Policy.
               </p>
             </div>
             <div className="md:w-2/3 grid sm:grid-cols-2 gap-4 auto-rows-min">
               <div className="flex gap-3">
                 <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                 <p className="text-sm">Medicines are safe, effective, and of the highest quality.</p>
               </div>
               <div className="flex gap-3">
                 <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                 <p className="text-sm">Pricing remains fair and accessible.</p>
               </div>
               <div className="flex gap-3">
                 <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                 <p className="text-sm">Supply chains are secure, transparent, and reliable.</p>
               </div>
               <div className="flex gap-3">
                 <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                 <p className="text-sm">Sourcing highly specialized and extemporaneous medications tailored to patient needs.</p>
               </div>
             </div>
           </div>
        </motion.div>

        {/* Why Choose Us */}
        <motion.div variants={fadeUp} className="space-y-6 pb-10">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose Healthclique?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             <Card>
               <CardHeader>
                 <ShieldCheck className="w-6 h-6 text-primary mb-2" />
                 <CardTitle className="text-lg">Trusted Expertise</CardTitle>
                 <CardDescription>Led by qualified Pharmacists who understand your healthcare needs.</CardDescription>
               </CardHeader>
             </Card>
             <Card>
               <CardHeader>
                 <Pill className="w-6 h-6 text-primary mb-2" />
                 <CardTitle className="text-lg">Convenience</CardTitle>
                 <CardDescription>Easy prescription uploads and fast processing.</CardDescription>
               </CardHeader>
             </Card>
             <Card>
               <CardHeader>
                 <BrainCircuit className="w-6 h-6 text-primary mb-2" />
                 <CardTitle className="text-lg">Innovation</CardTitle>
                 <CardDescription>AI-driven solutions for smarter, faster access to medicines.</CardDescription>
               </CardHeader>
             </Card>
             <Card>
               <CardHeader>
                 <MapPin className="w-6 h-6 text-primary mb-2" />
                 <CardTitle className="text-lg">Wide Coverage</CardTitle>
                 <CardDescription>Serving both individuals and healthcare providers anywhere.</CardDescription>
               </CardHeader>
             </Card>
             <Card>
               <CardHeader>
                 <Truck className="w-6 h-6 text-primary mb-2" />
                 <CardTitle className="text-lg">Reliable Delivery</CardTitle>
                 <CardDescription>A robust supply chain that ensures prompt doorstep delivery.</CardDescription>
               </CardHeader>
             </Card>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div variants={fadeUp} className="text-center pt-8 border-t border-primary/10">
           <p className="text-primary font-bold text-lg mb-6">
             Healthclique Limited — Simplifying access to quality medicines through innovation, integrity, and care.
           </p>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
             <a 
               href="https://www.instagram.com/healthclique_specialties?utm_source=qr" 
               target="_blank" 
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
               Follow us on Instagram
             </a>
             
             <a 
               href="mailto:healthcliquespecialties@gmail.com" 
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
               Email Us
             </a>
           </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default About;
