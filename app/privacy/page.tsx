"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

import { TermsAgreements } from "@/components/myComponents/subs/TermsAgreements";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 md:px-8">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={fadeUp}
        className="max-w-4xl mx-auto"
      >
        <Card className="border-t-4 border-t-primary shadow-sm bg-card">
          <CardContent className="p-8 md:p-12 prose prose-slate max-w-none prose-h2:text-primary prose-a:text-indigo-600 prose-li:text-muted-foreground">
            {/* Same content... */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground italic">Effective Date: [Insert Date]</p>
            </div>
            
            <p className="text-lg leading-relaxed mb-6">
              Welcome to <strong>Healthclique Limited</strong> (“we,” “our,” or “us”). Your privacy is extremely important to us, and we are committed to protecting your personal data in accordance with applicable laws and best practices, including the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>, the <strong>General Data Protection Regulation (GDPR)</strong>, and other relevant international data protection frameworks.
            </p>
            <p className="text-lg leading-relaxed mb-8">
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, and related services (collectively, the “Platform”).
            </p>

            <Separator className="my-8" />

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
            <p>We may collect and process the following categories of personal data:</p>
            <h3 className="text-xl font-semibold mt-6 mb-2">a. Personal Identification Information</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Full name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Delivery address</li>
              <li>Date of birth (where necessary)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">b. Health & Prescription Data</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Prescription details and uploaded documents</li>
              <li>Medication history (where applicable)</li>
              <li>Relevant health-related information necessary to fulfill your orders</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">c. Transaction & Payment Information</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Billing details</li>
              <li>Payment method information (processed via secure third-party payment providers)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">d. Technical & Usage Data</h3>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>IP address</li>
              <li>Browser type and device information</li>
              <li>Platform usage data and cookies</li>
            </ul>

            <h2 className="text-2xl font-bold mt-10 mb-4">2. How We Use Your Information</h2>
            <p>We process your data for the following lawful purposes:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>To process and fulfill prescriptions and medicine orders</li>
              <li>To verify prescriptions and ensure regulatory compliance</li>
              <li>To facilitate secure payments and transactions</li>
              <li>To coordinate deliveries through logistics partners</li>
              <li>To communicate with you regarding orders, updates, and support</li>
              <li>To improve our platform, services, and user experience</li>
              <li>To comply with legal and regulatory obligations</li>
            </ul>
            <p className="mb-8">
              Where required under GDPR or NDPA, we rely on lawful bases such as <strong>consent</strong>, <strong>contractual necessity</strong>, <strong>legal obligation</strong>, and <strong>legitimate interest</strong>.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4">3. Sharing of Personal Data</h2>
            <p>To provide our services effectively, we may share your data with carefully selected third parties, including:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Regulatory authorities and government agencies (where legally required)</li>
              <li>Licensed pharmacies and healthcare professionals</li>
              <li>Logistics and delivery partners</li>
              <li>Payment processors and financial service providers</li>
              <li>Technology service providers and cloud infrastructure partners</li>
            </ul>
            <p className="italic text-muted-foreground mb-8">
              While we perform due diligence and work only with reputable partners, Healthclique Limited does not control and is not responsible for the independent privacy practices, policies, or actions of these third parties. We encourage users to review the privacy policies of any third-party services they interact with.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4">4. International Data Transfers</h2>
            <p>Your data may be transferred to and processed in countries outside Nigeria. Where this occurs, we ensure appropriate safeguards are in place, including:</p>
            <ul className="list-disc pl-6 space-y-2 mb-8">
              <li>Data transfer agreements compliant with GDPR standards</li>
              <li>Use of secure and reputable cloud service providers</li>
              <li>Ensuring adequate levels of data protection in recipient jurisdictions</li>
            </ul>

            <h2 className="text-2xl font-bold mt-10 mb-4">5. Data Retention</h2>
            <p>We retain your personal data only for as long as necessary to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Fulfill the purposes outlined in this policy</li>
              <li>Comply with legal, regulatory, and professional obligations</li>
              <li>Resolve disputes and enforce agreements</li>
            </ul>
            <p className="italic text-muted-foreground mb-8">
              Health-related data may be retained for longer periods where required by applicable healthcare regulations.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4">6. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your data, including:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Encryption of sensitive information</li>
              <li>Secure servers and access controls</li>
              <li>Regular system monitoring and updates</li>
            </ul>
            <p className="mb-8">
              Despite our efforts, no system can be guaranteed to be completely secure. However, we continuously strive to protect your information against unauthorized access, loss, or misuse.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li><strong>Right to access</strong> your personal data</li>
              <li><strong>Right to correct</strong> inaccurate or incomplete data</li>
              <li><strong>Right to erasure</strong> (“right to be forgotten”)</li>
              <li><strong>Right to restrict processing</strong></li>
              <li><strong>Right to data portability</strong></li>
              <li><strong>Right to object</strong> to certain processing activities</li>
              <li><strong>Right to withdraw consent</strong> at any time</li>
            </ul>
            <p className="mb-8">To exercise your rights, please contact us using the details below.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">8. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Enhance user experience</li>
              <li>Analyze platform usage</li>
              <li>Improve service delivery</li>
            </ul>
            <p className="mb-8">You can control cookie preferences through your browser settings.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">9. Third-Party Links</h2>
            <p className="mb-8">
              Our Platform may contain links to third-party websites or services. We are not responsible for the privacy practices or content of such external platforms.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4">10. Children’s Privacy</h2>
            <p className="mb-8">
              Our services are not intended for individuals under the age of 18 without parental or guardian supervision. We do not knowingly collect personal data from children without appropriate consent.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4">11. Updates to This Privacy Policy</h2>
            <p className="mb-8">
              We may update this Privacy Policy from time to time to reflect changes in legal, regulatory, or operational requirements. Updates will be posted on this page with a revised “Effective Date.”
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4">12. Contact Us</h2>
            <p className="mb-6">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us or visit our contact page.
            </p>

            <Separator className="my-8" />
            
            <p className="text-center font-semibold mb-2">
              By using our Platform, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described herein.
            </p>
            <p className="text-center text-primary font-bold mt-6">
              Healthclique Limited – Committed to protecting your privacy while delivering safe, reliable, and innovative healthcare solutions.
            </p>

            <div className="mt-10">
              <TermsAgreements />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};


export default PrivacyPolicy;
