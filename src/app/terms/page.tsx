import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-semibold">Terms of Use</span>
      </nav>

      <div className="bg-white rounded-sm border border-gray-200 p-6 sm:p-8 shadow-xs text-xs text-gray-700 leading-relaxed space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b">
          <FileText className="w-6 h-6 text-[#2874f0]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Terms of Use & Marketplace Conditions</h1>
            <p className="text-[11px] text-gray-400">Effective Date: October 2026</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using {SITE_CONFIG.storeName}, you agree to be bound by these Terms of Use, our Privacy Policy, and applicable Indian laws and regulations under the Consumer Protection (E-Commerce) Rules.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">2. Account Registration and Mobile Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your mobile OTP and access credentials. Any activity originating from your verified mobile phone number will be attributed to your customer profile.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">3. Pricing and Stock Availability</h2>
          <p>
            All prices displayed are in Indian Rupees (INR) inclusive of applicable GST unless explicitly stated otherwise. We reserve the right to cancel orders in case of pricing errors or sudden supplier stock exhaustion, in which case full refunds will be issued immediately.
          </p>
        </section>
      </div>
    </div>
  );
}
