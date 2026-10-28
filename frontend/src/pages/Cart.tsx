import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { getProductImageUrl } from '../utils/api';

export default function Cart() {
  const { items, loading, fetchCart, updateCartItem, removeCartItem, clearCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQtyChange = async (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    try {
      await updateCartItem(itemId, undefined, undefined, newQty);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const hasUnavailableItems = items.some((item) => !item.isAvailable);

  if (loading && items.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-slate-500 font-semibold">Loading your rental cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-6 bg-slate-50">
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto border border-slate-100 shadow-sm">
          <ShoppingBag className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800">Your rental cart is empty</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Browse our curated marketplace categories and configure rental dates for the gear you need.
          </p>
        </div>
        <Link
          to="/"
          className="inline-block bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-md shadow-brand-500/10 transition cursor-pointer"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-6 bg-slate-50">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-sans">
          Your Rental Cart
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition cursor-pointer font-bold"
        >
          <Trash2 className="w-4 h-4" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white p-5 rounded-3xl border flex flex-col sm:flex-row gap-5 items-stretch sm:items-center justify-between transition-all shadow-sm ${
                !item.isAvailable ? 'border-red-200 bg-red-50/30' : 'border-slate-100'
              }`}
            >
              <div className="flex gap-4 items-center flex-1">
                <img
                  src={productImage(item.product.images)}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-100"
                />
                <div className="space-y-1">
                  <span className="text-[9px] text-brand-600 font-extrabold uppercase tracking-wider block">
                    {item.product.vendor.name}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-800 line-clamp-1">{item.product.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    Rental Dates:{' '}
                    <strong className="text-slate-700">
                      {new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}
                    </strong>
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Duration: {item.rentalDays} days
                  </p>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
                  <button
                    onClick={() => handleQtyChange(item.id, item.quantity, -1)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition w-5 h-5 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => handleQtyChange(item.id, item.quantity, 1)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition w-5 h-5 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

              </div>

              <div className="flex sm:flex-col justify-between items-center gap-4 sm:pl-4 sm:border-l border-slate-100">
                <button
                  onClick={() => removeCartItem(item.id)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 transition cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {!item.isAvailable && (
                <div className="w-full sm:col-span-full bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl flex items-center gap-2 text-[11px] text-red-500 mt-2 sm:mt-0 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Booking Conflict:</strong> {item.availabilityReason || 'Gear is unavailable for chosen dates.'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-slate-800">Order Summary</h3>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Order Details</h4>
              <div className="space-y-2 text-xs">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-slate-600 font-semibold gap-4">
                    <span className="truncate max-w-[70%] text-slate-700">{item.product.name}</span>
                    <span className="shrink-0 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-bold">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {hasUnavailableItems && (
              <div className="bg-red-50 border border-red-100 p-3.5 rounded-2xl flex items-start gap-2 text-xs text-red-500 leading-normal">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Please resolve conflicts or remove booked out items from your cart before checking out.</p>
              </div>
            )}

            <button
              onClick={() => navigate('/checkout')}
              disabled={hasUnavailableItems}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
            >
              Proceed to Verification & Checkout <ArrowRight className="w-4 h-4" />
            </button>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-[10px] text-slate-400 leading-normal font-medium">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Secure Rental System
              </div>
              <p>✔ Security deposits are safely held authorization-only and returned within 24 hours of gear return inspection.</p>
              <p>✔ Rentals include free inspection check sheet on dispatch to safeguard against minor pre-existing scuffs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function productImage(images: string): string {
  return getProductImageUrl(images);
}
