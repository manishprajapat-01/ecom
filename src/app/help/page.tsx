import Link from "next/link";
import { HelpCircle, PhoneCall, Mail, MessageSquare, ChevronRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

export default function HelpPage() {
  const faqs = [
    {
      q: "How do I track my BharatBazaar order?",
      a: "Go to your My Orders section from the top navigation bar. Select any active order to view the real-time fulfillment timeline including Dispatch, Transit, Out for Delivery, and Delivery agent contact.",
    },
    {
      q: "What payment methods are supported?",
      a: "We support UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit & Debit cards (RuPay, Visa, Mastercard), Net Banking across 50+ Indian banks, and Cash on Delivery (COD).",
    },
    {
      q: "What is the return and replacement policy?",
      a: "Most items qualify for a 7-day hassle-free return or replacement if received damaged, defective, or different from described. Initiate returns from the Orders page.",
    },
    {
      q: "What is BharatBazaar Assured?",
      a: "The Assured badge signifies that the product has passed our stringent 6-step quality inspection, is backed by authentic brand warranty, and ships with priority speed.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-semibold">Help & 24x7 Customer Care</span>
      </nav>

      <div className="bg-white rounded-sm border border-gray-200 p-6 shadow-xs">
        <h1 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-[#2874f0]" /> BharatBazaar 24x7 Customer Care
        </h1>
        <p className="text-xs text-gray-500 mb-6">
          We are here to assist you with order status, payments, refunds, and warranties.
        </p>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-xs">
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-sm">
            <PhoneCall className="w-5 h-5 text-[#2874f0] mb-2" />
            <h3 className="font-bold text-gray-900">Toll-Free Helpline</h3>
            <p className="text-blue-700 font-bold mt-1">{SITE_CONFIG.supportPhone}</p>
            <p className="text-[11px] text-gray-500 mt-1">Available 24 hours a day, 7 days a week</p>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-sm">
            <Mail className="w-5 h-5 text-emerald-600 mb-2" />
            <h3 className="font-bold text-gray-900">Email Support</h3>
            <p className="text-emerald-700 font-bold mt-1">{SITE_CONFIG.supportEmail}</p>
            <p className="text-[11px] text-gray-500 mt-1">Average response within 2 hours</p>
          </div>

          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-sm">
            <MessageSquare className="w-5 h-5 text-purple-600 mb-2" />
            <h3 className="font-bold text-gray-900">Grievance Cell</h3>
            <p className="text-purple-700 font-bold mt-1">Bengaluru, Karnataka</p>
            <p className="text-[11px] text-gray-500 mt-1">Nodal Officer: grievance@bharatbazaar.in</p>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 text-xs divide-y divide-gray-100">
            {faqs.map((faq, idx) => (
              <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                <h3 className="font-bold text-gray-900 mb-1">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
