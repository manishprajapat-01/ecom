import React from "react";
import Link from "next/link";
import {
  Store,
  HelpCircle,
  Gift,
  Sparkles,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#212121] text-white pt-10 pb-6 text-xs mt-12 border-t border-gray-800">
      {/* Main Multi-Column Links Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
          {/* ABOUT */}
          <div>
            <h3 className="text-gray-400 font-bold mb-3 tracking-wider text-[11px] uppercase">
              About
            </h3>
            <ul className="space-y-2 text-gray-300 text-xs">
              <li><Link href="/help" className="hover:underline">Contact Us</Link></li>
              <li><Link href="/help" className="hover:underline">About Us</Link></li>
              <li><Link href="/products" className="hover:underline">Careers</Link></li>
              <li><Link href="/help" className="hover:underline">Flipkart Stories</Link></li>
              <li><Link href="/help" className="hover:underline">Press</Link></li>
              <li><Link href="/help" className="hover:underline">Corporate Information</Link></li>
            </ul>
          </div>

          {/* GROUP COMPANIES */}
          <div>
            <h3 className="text-gray-400 font-bold mb-3 tracking-wider text-[11px] uppercase">
              Group Companies
            </h3>
            <ul className="space-y-2 text-gray-300 text-xs">
              <li><a href="https://myntra.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Myntra</a></li>
              <li><a href="https://cleartrip.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Cleartrip</a></li>
              <li><a href="https://shopsy.in" target="_blank" rel="noopener noreferrer" className="hover:underline">Shopsy</a></li>
            </ul>
          </div>

          {/* HELP */}
          <div>
            <h3 className="text-gray-400 font-bold mb-3 tracking-wider text-[11px] uppercase">
              Help
            </h3>
            <ul className="space-y-2 text-gray-300 text-xs">
              <li><Link href="/help" className="hover:underline">Payments</Link></li>
              <li><Link href="/help" className="hover:underline">Shipping</Link></li>
              <li><Link href="/refund-policy" className="hover:underline">Cancellation & Returns</Link></li>
              <li><Link href="/help" className="hover:underline">FAQ & 24x7 Help</Link></li>
              <li><Link href="/help" className="hover:underline">Report Infringement</Link></li>
            </ul>
          </div>

          {/* CONSUMER POLICY */}
          <div>
            <h3 className="text-gray-400 font-bold mb-3 tracking-wider text-[11px] uppercase">
              Consumer Policy
            </h3>
            <ul className="space-y-2 text-gray-300 text-xs">
              <li><Link href="/refund-policy" className="hover:underline">Cancellation & Returns</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms Of Use</Link></li>
              <li><Link href="/privacy-policy" className="hover:underline">Security & Privacy</Link></li>
              <li><Link href="/help" className="hover:underline">Sitemap</Link></li>
              <li><Link href="/help" className="hover:underline">Grievance Redressal</Link></li>
              <li><Link href="/help" className="hover:underline">EPR Compliance</Link></li>
            </ul>
          </div>

          {/* Mail Us */}
          <div className="border-t lg:border-t-0 lg:border-l border-gray-700 lg:pl-6 pt-4 lg:pt-0">
            <h3 className="text-gray-400 font-bold mb-2 tracking-wider text-[11px] uppercase">
              Mail Us:
            </h3>
            <p className="text-gray-300 leading-relaxed text-[11px]">
              Flipkart Internet Private Limited,<br />
              Buildings Alyssa, Begonia & Clove Embassy Tech Village,<br />
              Outer Ring Road, Devarabeesanahalli Village,<br />
              Bengaluru, 560103, Karnataka, India
            </p>
          </div>

          {/* Registered Office Address */}
          <div className="border-t lg:border-t-0 lg:border-l border-gray-700 lg:pl-6 pt-4 lg:pt-0">
            <h3 className="text-gray-400 font-bold mb-2 tracking-wider text-[11px] uppercase">
              Registered Office:
            </h3>
            <p className="text-gray-300 leading-relaxed text-[11px]">
              Flipkart Internet Private Limited,<br />
              Buildings Alyssa, Begonia & Clove Embassy Tech Village,<br />
              Outer Ring Road, Bengaluru, 560103, Karnataka, India<br />
              CIN: U51109KA2012PTC066107<br />
              Telephone: <span className="text-[#2874f0]">044-45614700 / 044-67415800</span>
            </p>
          </div>
        </div>
      </div>

      {/* Flipkart Iconic Bottom Bar */}
      <div className="border-t border-gray-700/80 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-gray-300 text-xs gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/admin" className="flex items-center gap-1.5 hover:text-white transition">
              <Store className="w-4 h-4 text-[#ffe500]" />
              <span>Become a Seller</span>
            </Link>
            <Link href="/help" className="flex items-center gap-1.5 hover:text-white transition">
              <Sparkles className="w-4 h-4 text-[#ffe500]" />
              <span>Advertise</span>
            </Link>
            <Link href="/account" className="flex items-center gap-1.5 hover:text-white transition">
              <Gift className="w-4 h-4 text-[#ffe500]" />
              <span>Gift Cards</span>
            </Link>
            <Link href="/help" className="flex items-center gap-1.5 hover:text-white transition">
              <HelpCircle className="w-4 h-4 text-[#ffe500]" />
              <span>Help Center</span>
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-gray-400 text-center text-[11px]">
            <span>© 2007-2026 Flipkart.com</span>
          </div>

          {/* Payment Icons */}
          <div className="flex items-center gap-2 text-gray-400 text-[11px]">
            <span className="font-semibold text-gray-300">Payment Methods:</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">VISA</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">Mastercard</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">RuPay</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">UPI</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
