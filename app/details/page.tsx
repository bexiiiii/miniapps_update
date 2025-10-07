"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function DetailsPage() {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }
  }, []);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <Link href="/" className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        
        <h1 className="text-base font-bold text-black">Details</h1>
        
        <button className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* Location Info */}
      <div className="px-4 mt-4">
        <h2 className="text-xl font-semibold text-black">Doner na abaya</h2>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="flex items-center gap-3 text-xs font-semibold text-black/60">
            <span>15 meal</span>
            <span>Кабанбай батыра</span>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="px-4 mt-6">
        <div className="bg-[#73be61] rounded-2xl h-48"></div>
      </div>

      {/* Product Info */}
      <div className="px-4 mt-4">
        <h3 className="text-lg font-semibold text-black">Донер говяжий</h3>
        <p className="text-sm font-semibold text-black/60 mt-2">краткое описание</p>
      </div>

      {/* Price Section */}
      <div className="px-4 mt-6">
        <div className="bg-[#73be61] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-xl px-3 py-1">
                <span className="text-[#73be61] text-sm font-medium">-50%</span>
              </div>
              <p className="text-sm font-medium text-white/60 line-through">2200 kzt</p>
            </div>
            <p className="text-2xl font-bold text-white">1100 kzt</p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 bg-white safe-area-inset-bottom">
        <div className="flex gap-3">
          <div className="bg-gray-100 rounded-xl flex items-center justify-between px-4 h-12">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-xl font-normal text-black px-2"
            >
              -
            </button>
            <span className="text-2xl font-semibold text-black mx-4">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="text-xl font-normal text-black px-2"
            >
              +
            </button>
          </div>
          
          <button className="flex-1 bg-[#73be61] rounded-xl h-12 flex items-center justify-center">
            <span className="text-lg font-medium text-white">Добавить</span>
          </button>
        </div>
      </div>
    </div>
  );
}
