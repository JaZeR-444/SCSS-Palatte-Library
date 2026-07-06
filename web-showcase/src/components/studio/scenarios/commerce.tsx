"use client";

import { useStudio } from "../studio-context";
import { Star, ShoppingCart, Percent, Heart, Trash2 } from "lucide-react";
import { useState } from "react";

export function CommerceScenario() {
  const { roleMapping } = useStudio();
  const [cartCount, setCartCount] = useState(0);
  const [activeSize, setActiveSize] = useState("M");
  const [isFavorited, setIsFavorited] = useState(false);

  const sizes = ["S", "M", "L", "XL"];

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Product Display */}
      <div className="lg:col-span-8">
        <div
          className="p-6 rounded-[2rem] border grid grid-cols-1 sm:grid-cols-2 gap-6 transition-colors"
          data-role="--ui-color-4"
          style={{
            backgroundColor: roleMapping["--ui-color-4"],
            borderColor: roleMapping["--ui-color-5"],
          }}
        >
          {/* Product Image Gallery Block */}
          <div
            className="aspect-square rounded-2xl relative overflow-hidden flex flex-col justify-between p-4"
            data-role="--ui-color-1"
            style={{
              background: `linear-gradient(135deg, ${roleMapping["--ui-color-1"]}dd, ${roleMapping["--ui-color-2"]}dd)`,
            }}
          >
            {/* Promo Tag */}
            <div
              className="self-start flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-md"
              data-role="--ui-color-8"
              style={{ backgroundColor: roleMapping["--ui-color-8"] }} // Success state (Green)
            >
              <Percent className="h-3 w-3" />
              <span>20% OFF</span>
            </div>

            {/* Favorite button */}
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-all active:scale-90"
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
              />
            </button>

            {/* Mock Graphic */}
            <div className="flex-1 flex items-center justify-center text-white/25">
              <ShoppingCart className="h-24 w-24 stroke-[1]" />
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/60">
                New Arrival
              </span>
              <h5 className="font-bold text-xs mt-0.5">
                Atmosphere Active Jacket
              </h5>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between py-2">
            <div className="space-y-4">
              <div>
                <span
                  className="text-[9px] font-black uppercase tracking-widest"
                  data-role="--ui-color-7"
                  style={{ color: roleMapping["--ui-color-7"] }}
                >
                  Gear & Apparel
                </span>
                <h4
                  className="font-black text-xl tracking-tight mt-1"
                  data-role="--ui-color-6"
                  style={{ color: roleMapping["--ui-color-6"] }}
                >
                  Atmosphere Active Jacket
                </h4>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-current"
                    data-role="--ui-color-9"
                    style={{ color: roleMapping["--ui-color-9"] }} // Warning State (Orange/Yellow)
                  />
                ))}
                <Star
                  className="h-4 w-4 fill-current opacity-30"
                  data-role="--ui-color-9"
                  style={{ color: roleMapping["--ui-color-9"] }}
                />
                <span
                  className="text-[10px] font-bold ml-1.5"
                  data-role="--ui-color-7"
                  style={{ color: roleMapping["--ui-color-7"] }}
                >
                  4.0 (98 reviews)
                </span>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-2">
                <span
                  className="text-2xl font-black tracking-tight"
                  data-role="--ui-color-1"
                  style={{ color: roleMapping["--ui-color-1"] }} // Brand Primary
                >
                  $129.00
                </span>
                <span
                  className="text-xs line-through font-bold"
                  data-role="--ui-color-7"
                  style={{ color: roleMapping["--ui-color-7"] }}
                >
                  $159.00
                </span>
              </div>

              {/* Size Selector */}
              <div className="space-y-2">
                <span
                  className="text-[9px] font-black uppercase tracking-widest block"
                  data-role="--ui-color-7"
                  style={{ color: roleMapping["--ui-color-7"] }}
                >
                  Select Size
                </span>
                <div className="flex gap-2">
                  {sizes.map((size) => {
                    const isSelected = activeSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setActiveSize(size)}
                        className="w-10 h-10 rounded-xl text-xs font-black transition-all duration-300 border flex items-center justify-center hover:scale-105 active:scale-95"
                        data-role={isSelected ? "--ui-color-1" : "transparent"}
                        style={{
                          backgroundColor: isSelected
                            ? roleMapping["--ui-color-1"]
                            : "transparent",
                          borderColor: isSelected
                            ? roleMapping["--ui-color-1"]
                            : roleMapping["--ui-color-5"],
                          color: isSelected
                            ? roleMapping["--ui-color-4"]
                            : roleMapping["--ui-color-6"],
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => setCartCount((c) => c + 1)}
              className="w-full mt-6 py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              data-role="--ui-color-1"
              style={{
                backgroundColor: roleMapping["--ui-color-1"],
                boxShadow: `0 8px 20px -6px ${roleMapping["--ui-color-1"]}66`,
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Shopping Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Shopping Cart Drawer */}
        <div
          className="p-6 rounded-[2rem] border flex-1 flex flex-col justify-between"
          data-role="--ui-color-4"
          style={{
            backgroundColor: roleMapping["--ui-color-4"],
            borderColor: roleMapping["--ui-color-5"],
          }}
        >
          <div className="space-y-6">
            <div
              className="flex justify-between items-center pb-3 border-b"
              data-role="--ui-color-5"
              style={{ borderColor: roleMapping["--ui-color-5"] }}
            >
              <h4
                className="text-xs font-black uppercase tracking-widest"
                data-role="--ui-color-6"
                style={{ color: roleMapping["--ui-color-6"] }}
              >
                Your Cart
              </h4>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                data-role="--ui-color-10"
                style={{ backgroundColor: roleMapping["--ui-color-10"] }} // Danger State (Red)
              >
                {cartCount}
              </div>
            </div>

            {cartCount > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white"
                    data-role="--ui-color-1"
                    style={{
                      background: `linear-gradient(135deg, ${roleMapping["--ui-color-1"]}, ${roleMapping["--ui-color-2"]})`,
                    }}
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-bold truncate"
                      data-role="--ui-color-6"
                      style={{ color: roleMapping["--ui-color-6"] }}
                    >
                      Jacket • {activeSize}
                    </p>
                    <p
                      className="text-[10px] font-bold"
                      data-role="--ui-color-7"
                      style={{ color: roleMapping["--ui-color-7"] }}
                    >
                      {cartCount}x • $129.00
                    </p>
                  </div>
                  <button
                    onClick={() => setCartCount(0)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    data-role="--ui-color-10"
                    style={{ color: roleMapping["--ui-color-10"] }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div
                  className="p-4 rounded-xl border border-dashed text-[10px] font-semibold flex items-center gap-2"
                  data-role="--ui-color-8"
                  style={{
                    backgroundColor: roleMapping["--ui-color-8"] + "0d",
                    borderColor: roleMapping["--ui-color-8"] + "33",
                    color: roleMapping["--ui-color-8"],
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  Free shipping promo code applied!
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <ShoppingCart
                  className="h-10 w-10 mx-auto opacity-30"
                  data-role="--ui-color-7"
                  style={{ color: roleMapping["--ui-color-7"] }}
                />
                <p
                  className="text-xs font-semibold"
                  data-role="--ui-color-7"
                  style={{ color: roleMapping["--ui-color-7"] }}
                >
                  Your cart is empty.
                </p>
              </div>
            )}
          </div>

          <div
            className="pt-6 border-t mt-6"
            data-role="--ui-color-5"
            style={{ borderColor: roleMapping["--ui-color-5"] }}
          >
            <div className="flex justify-between items-center mb-4">
              <span
                className="text-xs font-bold"
                data-role="--ui-color-7"
                style={{ color: roleMapping["--ui-color-7"] }}
              >
                Subtotal
              </span>
              <span
                className="text-sm font-black"
                data-role="--ui-color-6"
                style={{ color: roleMapping["--ui-color-6"] }}
              >
                ${(cartCount * 129).toFixed(2)}
              </span>
            </div>
            <button
              disabled={cartCount === 0}
              className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              data-role="--ui-color-1"
              style={{ backgroundColor: roleMapping["--ui-color-1"] }}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
