import React, { useState } from 'react';
import {
  Package,
  Plus,
  Minus,
  Trash2,
  Battery,
  HardDrive,
  Briefcase,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { parseProductSpecsData, getDefaultBoxItems, type BoxItem } from './ProductSpecsEditor';
import { getProductImageUrl } from '../utils/api';

export interface EditableBoxItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  desc?: string;
  isCustom?: boolean;
}

export function parseBoxItemToEditable(item: BoxItem, index: number): EditableBoxItem {
  const rawQty = item.qty || '1x Unit';
  const match = rawQty.match(/^(\d+)\s*x?\s*(.*)$/i);
  let qty = 1;
  let unit = 'Unit';

  if (match) {
    qty = parseInt(match[1], 10) || 1;
    unit = match[2]?.trim() || 'Unit';
  } else if (!isNaN(Number(rawQty))) {
    qty = Number(rawQty);
  }

  return {
    id: `box-${index}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: item.name,
    qty: Math.max(1, qty),
    unit: unit || 'Unit',
    desc: item.desc || '',
    isCustom: false,
  };
}

export function initializeBoxItemsForProduct(product: any): EditableBoxItem[] {
  const { boxItems } = parseProductSpecsData(product.specs);
  const itemsToUse = boxItems.length > 0 ? boxItems : getDefaultBoxItems(product.name);
  return itemsToUse.map((b, idx) => parseBoxItemToEditable(b, idx));
}

interface CheckoutBoxCustomizerProps {
  items: any[];
  customBoxState: Record<string, EditableBoxItem[]>;
  onChangeBoxState: (cartItemId: string, updated: EditableBoxItem[]) => void;
  packingNotes: Record<string, string>;
  onChangePackingNote: (cartItemId: string, note: string) => void;
}

export default function CheckoutBoxCustomizer({
  items,
  customBoxState,
  onChangeBoxState,
  packingNotes,
  onChangePackingNote,
}: CheckoutBoxCustomizerProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(items[0]?.id || null);
  const [customItemInput, setCustomItemInput] = useState<Record<string, { name: string; qty: number }>>({});

  const getItemIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('battery') || lower.includes('batteries') || lower.includes('v-mount')) {
      return <Battery className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (lower.includes('charger') || lower.includes('power') || lower.includes('ac cord') || lower.includes('cable')) {
      return <Zap className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (lower.includes('card') || lower.includes('cfexpress') || lower.includes('sd') || lower.includes('media') || lower.includes('ssd')) {
      return <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    if (lower.includes('case') || lower.includes('pelican') || lower.includes('bag') || lower.includes('box')) {
      return <Briefcase className="w-4 h-4 text-purple-600 shrink-0" />;
    }
    return <Package className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  const updateQuantity = (cartItemId: string, boxItemId: string, delta: number) => {
    const currentList = customBoxState[cartItemId] || [];
    const updated = currentList.map((item) => {
      if (item.id === boxItemId) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter((item) => item.qty > 0);

    onChangeBoxState(cartItemId, updated);
  };

  const addQuickPreset = (cartItemId: string, presetName: string, defaultUnit: string, qtyToAdd: number = 1) => {
    const currentList = customBoxState[cartItemId] || [];
    const existingIdx = currentList.findIndex((item) => item.name.toLowerCase() === presetName.toLowerCase());

    if (existingIdx >= 0) {
      const updated = [...currentList];
      updated[existingIdx].qty += qtyToAdd;
      onChangeBoxState(cartItemId, updated);
    } else {
      const newItem: EditableBoxItem = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: presetName,
        qty: qtyToAdd,
        unit: defaultUnit,
        desc: 'Added as customer kit accessory',
        isCustom: true,
      };
      onChangeBoxState(cartItemId, [...currentList, newItem]);
    }
  };

  const handleAddCustomItem = (cartItemId: string) => {
    const input = customItemInput[cartItemId];
    if (!input || !input.name.trim()) return;

    const currentList = customBoxState[cartItemId] || [];
    const newItem: EditableBoxItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: input.name.trim(),
      qty: Math.max(1, input.qty || 1),
      unit: 'Item',
      desc: 'Customer requested accessory',
      isCustom: true,
    };

    onChangeBoxState(cartItemId, [...currentList, newItem]);
    setCustomItemInput((prev) => ({
      ...prev,
      [cartItemId]: { name: '', qty: 1 },
    }));
  };

  const handleResetToDefault = (cartItem: any) => {
    const defaults = initializeBoxItemsForProduct(cartItem.product);
    onChangeBoxState(cartItem.id, defaults);
  };

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="checkout-box-heading"
      className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#6D28D9] text-white text-xs flex items-center justify-center font-bold">
              2
            </span>
            <h2
              id="checkout-box-heading"
              className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2"
            >
              <span>Customize "What's in the Box" & Kit Accessories</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-8">
            Need extra batteries, high-speed memory cards, or specific chargers? Adjust your package kit below before dispatch.
          </p>
        </div>

        <span className="self-start sm:self-center text-[10px] font-bold px-3 py-1 rounded-full bg-purple-50 text-[#6D28D9] border border-purple-200">
          Editable by Customer
        </span>
      </div>

      <div className="space-y-4">
        {items.map((cartItem) => {
          const boxList = customBoxState[cartItem.id] || [];
          const isExpanded = expandedItemId === cartItem.id;
          const totalIncludedUnits = boxList.reduce((sum, item) => sum + item.qty, 0);

          const batteryItem = boxList.find((b) => b.name.toLowerCase().includes('batter'));
          const batteryCount = batteryItem ? batteryItem.qty : 0;

          return (
            <div
              key={cartItem.id}
              className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
            >
              <div
                onClick={() => setExpandedItemId(isExpanded ? null : cartItem.id)}
                className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition border-b border-slate-100 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 p-1 flex items-center justify-center">
                    <img
                      src={getProductImageUrl(cartItem.product.images)}
                      alt={cartItem.product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {cartItem.product.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                      <span className="font-bold text-[#6D28D9]">
                        {boxList.length} Items Included ({totalIncludedUnits} total parts)
                      </span>
                      {batteryCount > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Battery className="w-3 h-3 text-emerald-600" />
                          <span>{batteryCount}x Batteries</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-bold text-slate-500 hover:text-[#6D28D9]">
                    {isExpanded ? 'Collapse Kit' : 'Customize Items'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 sm:p-5 space-y-4 bg-white">
                  
                  <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Quick Add Kit Extras:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetToDefault(cartItem)}
                        className="text-[10px] text-slate-500 hover:text-purple-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="Reset this kit to standard defaults"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Defaults</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => addQuickPreset(cartItem.id, 'High-Capacity Batteries', 'Batteries', 1)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 text-[#6D28D9] font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <Battery className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+1 Extra Battery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => addQuickPreset(cartItem.id, 'High-Speed Pro Media Card', '128GB', 1)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 text-[#6D28D9] font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                        <span>+1 Extra 128GB Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => addQuickPreset(cartItem.id, 'Dual Fast Charger & AC Cord', 'Charger Set', 1)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 text-[#6D28D9] font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>+1 Extra Fast Charger</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => addQuickPreset(cartItem.id, 'Micro/Full HDMI Cable', 'Cable', 1)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 text-slate-700 font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ HDMI Cable</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Included In This Rental Box:
                    </div>

                    <div className="space-y-2">
                      {boxList.map((boxItem) => {
                        const isBattery = boxItem.name.toLowerCase().includes('batter');

                        return (
                          <div
                            key={boxItem.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                              boxItem.isCustom
                                ? 'bg-purple-50/40 border-purple-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                                {getItemIcon(boxItem.name)}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-xs text-slate-900">
                                    {boxItem.name}
                                  </h4>
                                  {boxItem.isCustom && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-[#6D28D9]">
                                      Customer Added
                                    </span>
                                  )}
                                  {isBattery && boxItem.qty > 2 && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                      Boosted Pack
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {boxItem.desc || `${boxItem.unit} packed in custom kit`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="inline-flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(cartItem.id, boxItem.id, -1)}
                                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-red-600 transition cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  {boxItem.qty === 1 ? (
                                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                                  ) : (
                                    <Minus className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <span className="w-10 text-center font-black text-xs text-slate-900 select-none">
                                  {boxItem.qty}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => updateQuantity(cartItem.id, boxItem.id, 1)}
                                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-purple-50 hover:text-[#6D28D9] transition cursor-pointer"
                                  title="Increase quantity (e.g. extra battery or card)"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="text-xs font-semibold text-slate-600 min-w-14">
                                {boxItem.unit || 'Units'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      + Add Custom Gear / Accessory to this Box:
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Extra V-Mount Battery, Card Reader, Mattebox flags..."
                        value={customItemInput[cartItem.id]?.name || ''}
                        onChange={(e) =>
                          setCustomItemInput((prev) => ({
                            ...prev,
                            [cartItem.id]: {
                              name: e.target.value,
                              qty: prev[cartItem.id]?.qty || 1,
                            },
                          }))
                        }
                        className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={customItemInput[cartItem.id]?.qty || 1}
                          onChange={(e) =>
                            setCustomItemInput((prev) => ({
                              ...prev,
                              [cartItem.id]: {
                                name: prev[cartItem.id]?.name || '',
                                qty: Number(e.target.value) || 1,
                              },
                            }))
                          }
                          className="w-16 bg-white border border-slate-200 px-2 py-1.5 rounded-xl text-xs text-center font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomItem(cartItem.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#581c87] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`packing-notes-${cartItem.id}`}
                      className="block text-[11px] font-bold text-slate-700 mb-1"
                    >
                      Special Packing Instructions for Dispatch Hub:
                    </label>
                    <input
                      id={`packing-notes-${cartItem.id}`}
                      type="text"
                      placeholder="e.g. Please pre-charge all batteries to 100%, pack Type-C USB cables..."
                      value={packingNotes[cartItem.id] || ''}
                      onChange={(e) => onChangePackingNote(cartItem.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                    />
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
