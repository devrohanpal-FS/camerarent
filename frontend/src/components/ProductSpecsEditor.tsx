import React, { useState } from 'react';
import { Plus, Trash2, Package, Sparkles, Layers } from 'lucide-react';

export interface TechSpecItem {
  key: string;
  value: string;
}

export interface BoxItem {
  name: string;
  qty: string;
  desc: string;
}

export function parseProductSpecsData(specsRaw: string | undefined | null): {
  techSpecs: TechSpecItem[];
  boxItems: BoxItem[];
} {
  if (!specsRaw) {
    return { techSpecs: [], boxItems: [] };
  }
  try {
    const parsed = typeof specsRaw === 'string' ? JSON.parse(specsRaw) : specsRaw;
    if (!parsed || typeof parsed !== 'object') {
      return { techSpecs: [], boxItems: [] };
    }

    let techSpecs: TechSpecItem[] = [];
    if (Array.isArray(parsed.technicalSpecs)) {
      techSpecs = parsed.technicalSpecs.map((item: any) => ({
        key: String(item.key || ''),
        value: String(item.value || ''),
      }));
    } else {
      techSpecs = Object.entries(parsed)
        .filter(
          ([k]) =>
            k !== 'technicalSpecs' &&
            k !== 'whatsInTheBox' &&
            typeof parsed[k] !== 'object'
        )
        .map(([key, val]) => ({ key, value: String(val) }));
    }

    let boxItems: BoxItem[] = [];
    if (Array.isArray(parsed.whatsInTheBox)) {
      boxItems = parsed.whatsInTheBox.map((item: any) => ({
        name: String(item.name || ''),
        qty: String(item.qty || '1x Unit'),
        desc: String(item.desc || ''),
      }));
    }

    return { techSpecs, boxItems };
  } catch {
    return { techSpecs: [], boxItems: [] };
  }
}

export function serializeProductSpecsData(techSpecs: TechSpecItem[], boxItems: BoxItem[]): string {
  const cleanSpecs = techSpecs.filter((s) => s.key.trim() || s.value.trim());
  const cleanBox = boxItems.filter((b) => b.name.trim());

  const flatObject: Record<string, string> = {};
  for (const item of cleanSpecs) {
    if (item.key.trim()) {
      flatObject[item.key.trim()] = item.value.trim();
    }
  }

  return JSON.stringify({
    ...flatObject,
    technicalSpecs: cleanSpecs,
    whatsInTheBox: cleanBox,
  });
}

export function getDefaultBoxItems(productName: string = 'Main Unit'): BoxItem[] {
  return [
    { name: productName, qty: '1x Unit', desc: 'Tested & sensor-cleaned main unit' },
    { name: 'Pro Flight Hard Case', qty: '1x Case', desc: 'Custom laser-cut foam Pelican/Hard case' },
    { name: 'High-Capacity Batteries', qty: '2x Batteries', desc: 'Fully charged OEM battery pack' },
    { name: 'Dual Fast Charger & AC Cord', qty: '1x Set', desc: 'Rapid charging dock with Indian plug' },
    { name: 'High-Speed Pro Media Card', qty: '1x 128GB', desc: 'V90 / CFexpress high-bitrate card' },
    { name: 'Protective Caps, Hood & Strap', qty: '1x Kit', desc: 'Front/rear caps & microfiber kit' },
  ];
}

export function getDefaultTechSpecs(categoryName: string = 'Cameras'): TechSpecItem[] {
  return [
    { key: 'Equipment Category', value: categoryName },
    { key: 'Condition & Calibration', value: 'QC Passed • Sensor & Optics Cleaned' },
    {
      key: 'Mount / Interface',
      value: categoryName.toLowerCase().includes('canon')
        ? 'Canon RF / EF Mount'
        : 'Standard Cine / E-Mount',
    },
    { key: 'Power & Battery', value: '2x High-Capacity Rechargeable Batteries Included' },
    { key: 'Weather Sealing', value: 'Dust & Moisture Resistant Magnesium Alloy' },
    { key: 'Insurance Coverage', value: 'Eligible for CameraRent Damage Waiver' },
    { key: 'Dispatch Location', value: '74, Basement, Gautam Nagar, New Delhi 110049' },
  ];
}

interface ProductSpecsEditorProps {
  techSpecs: TechSpecItem[];
  onChangeTechSpecs: (specs: TechSpecItem[]) => void;
  boxItems: BoxItem[];
  onChangeBoxItems: (items: BoxItem[]) => void;
  productName?: string;
  categoryName?: string;
}

export default function ProductSpecsEditor({
  techSpecs,
  onChangeTechSpecs,
  boxItems,
  onChangeBoxItems,
  productName = 'Equipment',
  categoryName = 'Cameras',
}: ProductSpecsEditorProps) {
  const [activeSubTab, setActiveSubTab] = useState<'specs' | 'box'>('specs');

  const handleAddSpecRow = () => {
    onChangeTechSpecs([...techSpecs, { key: '', value: '' }]);
  };

  const handleUpdateSpecRow = (index: number, field: 'key' | 'value', text: string) => {
    const updated = [...techSpecs];
    updated[index] = { ...updated[index], [field]: text };
    onChangeTechSpecs(updated);
  };

  const handleRemoveSpecRow = (index: number) => {
    const updated = techSpecs.filter((_, idx) => idx !== index);
    onChangeTechSpecs(updated);
  };

  const handlePreFillSpecs = () => {
    if (techSpecs.length > 0 && !confirm('Pre-fill will append standard technical attributes. Continue?')) {
      return;
    }
    const defaults = getDefaultTechSpecs(categoryName);
    const existingKeys = new Set(techSpecs.map((s) => s.key.trim().toLowerCase()));
    const toAdd = defaults.filter((d) => !existingKeys.has(d.key.toLowerCase()));
    onChangeTechSpecs([...techSpecs, ...toAdd]);
  };

  const handleAddBoxRow = () => {
    onChangeBoxItems([...boxItems, { name: '', qty: '1x Unit', desc: '' }]);
  };

  const handleUpdateBoxRow = (index: number, field: 'name' | 'qty' | 'desc', text: string) => {
    const updated = [...boxItems];
    updated[index] = { ...updated[index], [field]: text };
    onChangeBoxItems(updated);
  };

  const handleRemoveBoxRow = (index: number) => {
    const updated = boxItems.filter((_, idx) => idx !== index);
    onChangeBoxItems(updated);
  };

  const handlePreFillBox = () => {
    if (boxItems.length > 0 && !confirm('Pre-fill standard kit will append default included items. Continue?')) {
      return;
    }
    const defaults = getDefaultBoxItems(productName || 'Main Unit');
    const existingNames = new Set(boxItems.map((b) => b.name.trim().toLowerCase()));
    const toAdd = defaults.filter((d) => !existingNames.has(d.name.toLowerCase()));
    onChangeBoxItems([...boxItems, ...toAdd]);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('specs')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'specs'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Technical Specifications</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                activeSubTab === 'specs' ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {techSpecs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('box')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'box'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>What's in the Box</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                activeSubTab === 'box' ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {boxItems.length}
            </span>
          </button>
        </div>

        {activeSubTab === 'specs' ? (
          <button
            type="button"
            onClick={handlePreFillSpecs}
            className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
            title="Pre-fill standard camera/equipment technical attributes"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-fill Standard Specs</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePreFillBox}
            className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
            title="Pre-fill 6 standard production kit items"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-fill Standard Kit (6 Items)</span>
          </button>
        )}
      </div>

      {activeSubTab === 'specs' && (
        <div className="space-y-3">
          <div className="hidden sm:flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
            <span className="w-5/12">Specification Attribute (Field Name)</span>
            <span className="w-6/12">Attribute Value (Details)</span>
            <span className="w-1/12 text-center">Action</span>
          </div>

          {techSpecs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
              <Layers className="mx-auto mb-2 h-6 w-6 text-slate-400" />
              <p className="font-semibold">No technical specifications added yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click "+ Add Specification Row" to add custom rows or "Pre-fill Standard Specs".
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {techSpecs.map((row, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 sm:p-2 shadow-2xs transition hover:border-purple-300"
                >
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => handleUpdateSpecRow(idx, 'key', e.target.value)}
                    placeholder="e.g. Mount, Sensor, Resolution, Weight"
                    className="w-full sm:w-5/12 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                    required
                  />

                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleUpdateSpecRow(idx, 'value', e.target.value)}
                    placeholder="e.g. Sony E-Mount Full-Frame, 4K 120p"
                    className="w-full sm:w-6/12 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                    required
                  />

                  <div className="w-full sm:w-1/12 flex justify-end sm:justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecRow(idx)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                      title="Delete this specification field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddSpecRow}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-purple-300 bg-purple-50/60 hover:bg-purple-100/80 py-2.5 text-xs font-bold text-purple-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Specification Field (Feild Badhayein)</span>
          </button>
        </div>
      )}

      {activeSubTab === 'box' && (
        <div className="space-y-3">
          <div className="hidden sm:flex items-center justify-between text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
            <span className="w-4/12">Included Item Name</span>
            <span className="w-3/12">Quantity / Units</span>
            <span className="w-4/12">Note / Description</span>
            <span className="w-1/12 text-center">Action</span>
          </div>

          {boxItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
              <Package className="mx-auto mb-2 h-6 w-6 text-slate-400" />
              <p className="font-semibold">No box items defined yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click "+ Add Box Item" or "Pre-fill Standard Kit" to populate.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {boxItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 sm:p-2 shadow-2xs transition hover:border-purple-300"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateBoxRow(idx, 'name', e.target.value)}
                    placeholder="e.g. Sony FX3 Body, Hard Case"
                    className="w-full sm:w-4/12 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                    required
                  />

                  <input
                    type="text"
                    value={item.qty}
                    onChange={(e) => handleUpdateBoxRow(idx, 'qty', e.target.value)}
                    placeholder="e.g. 1x Unit, 2x Batteries"
                    className="w-full sm:w-3/12 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                    required
                  />

                  <input
                    type="text"
                    value={item.desc}
                    onChange={(e) => handleUpdateBoxRow(idx, 'desc', e.target.value)}
                    placeholder="e.g. Laser-cut Pelican foam case"
                    className="w-full sm:w-4/12 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />

                  <div className="w-full sm:w-1/12 flex justify-end sm:justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveBoxRow(idx)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                      title="Remove this box item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddBoxRow}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/80 py-2.5 text-xs font-bold text-emerald-800 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add What's in the Box Item (Item Badhayein)</span>
          </button>
        </div>
      )}
    </div>
  );
}
