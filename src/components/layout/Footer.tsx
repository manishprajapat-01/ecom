import React from "react";
import Link from "next/link";
import { ShieldCheck, HelpCircle, RotateCcw, Truck } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

export function Footer() {
  return (
    <footer className="bg-[#172337] text-white pt-10 pb-6 text-xs mt-12 border-t border-gray-800">
      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 border-b border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-900/60 flex items-center justify-center text-yellow-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-gray-100">100% Authentic</h4>
            <p className="text-gray-400 text-[11px]">All products sourced directly from authorized brands</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-900/60 flex items-center justify-center text-yellow-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-gray-100">Easy Returns</h4>
            <p className="text-gray-400 text-[11px]">7-day hassle-free replacement or refund policy</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-900/60 flex items-center justify-center text-yellow-400">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-gray-100">Fast & Free Delivery</h4>
            <p className="text-gray-400 text-[11px]">Free delivery on orders above ₹500 across 19,000+ PIN codes</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-900/60 flex items-center justify-center text-yellow-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-gray-100">24x7 Customer Care</h4>
            <p className="text-gray-400 text-[11px]">Dedicated assistance via helpline: {SITE_CONFIG.supportPhone}</p>
          </div>
        </div>
      </div>

      {/* Main Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div>
            <h3 className="text-gray-400 font-semibold mb-3 tracking-wider text-[11px] uppercase">About</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/help" className="hover:underline">Contact Us</Link></li>
              <li><Link href="/help" className="hover:underline">About Us</Link></li>
              <li><Link href="/products" className="hover:underline">All Products</Link></li>
              <li><Link href="/help" className="hover:underline">Corporate Information</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-400 font-semibold mb-3 tracking-wider text-[11px] uppercase">Help</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/help" className="hover:underline">Payments</Link></li>
              <li><Link href="/help" className="hover:underline">Shipping</Link></li>
              <li><Link href="/refund-policy" className="hover:underline">Cancellation & Returns</Link></li>
              <li><Link href="/help" className="hover:underline">FAQ & Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-400 font-semibold mb-3 tracking-wider text-[11px] uppercase">Consumer Policy</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/refund-policy" className="hover:underline">Cancellation & Returns</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms Of Use</Link></li>
              <li><Link href="/privacy-policy" className="hover:underline">Security & Privacy</Link></li>
              <li><Link href="/help" className="hover:underline">Grievance Redressal</Link></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-2 text-gray-400 border-t md:border-t-0 md:border-l border-gray-700 md:pl-6 pt-4 md:pt-0">
            <h3 className="text-gray-400 font-semibold mb-2 tracking-wider text-[11px] uppercase">
              Registered Office Address:
            </h3>
            <p className="text-gray-300 leading-relaxed text-[11px]">
              {SITE_CONFIG.storeName} Internet Private Limited,<br />
              {SITE_CONFIG.address}<br />
              CIN: U51109KA2026PTC123456<br />
              Telephone: <span className="text-blue-400">{SITE_CONFIG.supportPhone}</span>
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[11px] text-gray-400">Accepted Payments:</span>
              <span className="font-bold text-gray-200">UPI • RuPay • Visa • Mastercard • NetBanking • COD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 pt-6 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-gray-400 text-[11px] gap-2">
          <p>© 2026 {SITE_CONFIG.storeName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:underline">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
