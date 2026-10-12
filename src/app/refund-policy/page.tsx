import Link from "next/link";
import { RotateCcw, ChevronRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 py-1 font-medium">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-semibold">Refund & Cancellation Policy</span>
      </nav>

      <div className="bg-white rounded-sm border border-gray-200 p-6 sm:p-8 shadow-xs text-xs text-gray-700 leading-relaxed space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b">
          <RotateCcw className="w-6 h-6 text-[#2874f0]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Refund, Return & Cancellation Policy</h1>
            <p className="text-[11px] text-gray-400">Clear, transparent customer guidelines</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">1. Order Cancellations</h2>
          <p>
            You may cancel an order anytime before it has been marked as <strong>Dispatched</strong> from our warehouse. Once cancelled, your payment will be refunded to the original payment source within 3-5 working days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">2. 7-Day Return and Replacement Window</h2>
          <p>
            Most physical goods purchased on {SITE_CONFIG.storeName} are eligible for a 7-day replacement or return if:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The item was received in a physically damaged or broken condition.</li>
            <li>The item has missing parts, accessories, or original warranty cards.</li>
            <li>The item does not match the product specifications displayed on the product page.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">3. Refund Processing Timeline</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>UPI & Net Banking:</strong> 24 to 48 hours to original bank account.</li>
            <li><strong>Credit & Debit Cards:</strong> 3 to 5 business days depending on issuing bank.</li>
            <li><strong>Cash on Delivery (COD):</strong> Transferred via instant IMPS/NEFT upon receiving customer bank account details.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
