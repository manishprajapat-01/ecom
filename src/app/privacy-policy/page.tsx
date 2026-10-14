import Link from "next/link";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-semibold">Privacy Policy</span>
      </nav>

      <div className="bg-white rounded-sm border border-gray-200 p-6 sm:p-8 shadow-xs text-xs text-gray-700 leading-relaxed space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b">
          <ShieldCheck className="w-6 h-6 text-[#2874f0]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Privacy Policy & Data Protection</h1>
            <p className="text-[11px] text-gray-400">Compliant with the Digital Personal Data Protection (DPDP) Act, India</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">1. Information We Collect</h2>
          <p>
            When you register on {SITE_CONFIG.storeName}, place an order, or interact with our marketplace, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Phone Number:</strong> Used exclusively for SMS OTP verification and critical delivery notifications.</li>
            <li><strong>Delivery Address:</strong> House number, street, city, state, and 6-digit Indian PIN code to dispatch shipments.</li>
            <li><strong>Location Data:</strong> Collected only with your explicit permission for Google Places address auto-fill. Never collected silently in background.</li>
            <li><strong>Payment Identifiers:</strong> We do NOT store card numbers, CVV, or UPI PINs. All payments are securely tokenized and handled directly by authorized RBI-licensed payment aggregators (e.g. Razorpay).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">2. How We Use Your Data</h2>
          <p>
            Your information is used solely to process orders, verify payments, schedule deliveries, and provide 24x7 customer support. We do not sell or rent your personal information to third-party marketing companies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">3. Security and Storage</h2>
          <p>
            All network communication is protected with 256-bit TLS encryption. Application session cookies use HTTP-only secure flags to prevent cross-site scripting (XSS).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">4. Grievance Officer</h2>
          <p>
            In accordance with the Information Technology Act and DPDP guidelines, our designated Grievance Officer can be contacted at:
          </p>
          <p className="font-semibold text-gray-900">
            Grievance Officer, {SITE_CONFIG.storeName} Internet Pvt. Ltd.<br />
            {SITE_CONFIG.address}<br />
            Email: privacy@flipkart.com
          </p>
        </section>
      </div>
    </div>
  );
}
