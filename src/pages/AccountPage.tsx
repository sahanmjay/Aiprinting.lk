import React, { useState } from 'react';
import { Search, Package, Clock, Truck, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR } from '../lib/formatters';
import { Order } from '../types';

export const AccountPage: React.FC = () => {
  const { orders, trackOrder } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const lookup = async (orderNumber: string, phone: string) => {
    setIsSearching(true);
    try {
      setSearchedOrder(await trackOrder(orderNumber, phone));
    } catch (err) {
      console.error('Order lookup failed:', err);
      setSearchedOrder(null);
    } finally {
      setHasSearched(true);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !phoneQuery.trim()) return;
    lookup(searchQuery.trim(), phoneQuery.trim());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px] uppercase">New Order</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-[10px] uppercase">Confirmed</span>;
      case 'in_production':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px] uppercase">In Production</span>;
      case 'ready':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold text-[10px] uppercase">Ready to Dispatch</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] uppercase">Delivered</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-semibold text-[10px] uppercase">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[10px] uppercase">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E6E0D6] pb-4 space-y-1">
        <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
          Order Tracking
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
          Track Your Print Order
        </h1>
        <p className="text-xs text-slate-500">
          Enter your order number and the phone number used at checkout to view production status and dispatch details.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs max-w-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. AIP-2026-014218"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden font-mono uppercase"
            />
          </div>
          <input
            type="tel"
            placeholder="Phone number"
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
            className="sm:w-40 px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-[#0F1B2D] hover:bg-[#182A45] text-white text-xs font-bold rounded transition-colors disabled:opacity-60"
          >
            {isSearching ? 'Searching…' : 'Track Status'}
          </button>
        </form>
      </div>

      {/* Searched Order Result */}
      {hasSearched && (
        <div>
          {searchedOrder ? (
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#E6E0D6] shadow-xs space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#E6E0D6] pb-4">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Order Number</div>
                  <div className="text-xl font-bold font-mono text-[#0F1B2D]">
                    {searchedOrder.orderNumber}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(searchedOrder.orderStatus)}
                  <span className="text-xs text-slate-500">
                    Placed: {new Date(searchedOrder.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status visual pipeline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className={`p-3 rounded border ${searchedOrder.orderStatus !== 'cancelled' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  1. Order Placed
                </div>
                <div className={`p-3 rounded border ${['confirmed', 'in_production', 'ready', 'delivered'].includes(searchedOrder.orderStatus) ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  2. Prepress Proof
                </div>
                <div className={`p-3 rounded border ${['in_production', 'ready', 'delivered'].includes(searchedOrder.orderStatus) ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  3. In Production
                </div>
                <div className={`p-3 rounded border ${['ready', 'delivered'].includes(searchedOrder.orderStatus) ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  4. Dispatched
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="font-bold text-xs text-[#0F1B2D] uppercase">Job Items</div>
                {searchedOrder.items.map((item) => (
                  <div key={item.id} className="p-3 bg-[#FAF8F5] rounded border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-[#0F1B2D]">{item.product.name}</div>
                      <div className="text-slate-500 text-[11px]">
                        {item.selectedOptions.map((o) => o.valueLabel).join(' · ')}
                      </div>
                    </div>
                    <div className="font-bold text-[#0F1B2D]">{formatLKR(item.lineTotal)}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-baseline border-t border-[#E6E0D6] pt-3 text-xs">
                <span className="text-slate-500">Total (including delivery):</span>
                <span className="text-base font-bold text-[#D6342C]">{formatLKR(searchedOrder.total)}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                No order found matching "{searchQuery}". Please check your order confirmation email or format (e.g. AIP-2026-0042).
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders in this device session */}
      {orders.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[#0F1B2D] uppercase tracking-wider">
            Your Recent Orders ({orders.length})
          </h3>
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  setSearchQuery(o.orderNumber);
                  setPhoneQuery(o.customerPhone);
                  lookup(o.orderNumber, o.customerPhone);
                }}
                className="bg-white p-4 rounded border border-[#E6E0D6] hover:border-[#0F1B2D] cursor-pointer transition-colors flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-[#0F1B2D]">{o.orderNumber}</div>
                  <div className="text-slate-500 text-[11px]">
                    {o.customerName} · {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#0F1B2D]">{formatLKR(o.total)}</span>
                  {getStatusBadge(o.orderStatus)}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
