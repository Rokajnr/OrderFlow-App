import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Category, MenuItem, Station } from '../../types';
import { formatKwacha } from '../../utils/formatters';
import {
  ArrowLeft,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Flame,
  Wine,
  Utensils,
  X,
  Edit2,
} from 'lucide-react';
import { BrandMark } from '../common/BrandMark';
import { OrderFlowButton } from '../common/OrderFlowButton';

interface MenuManagementScreenProps {
  onBackToOverview: () => void;
}

export function MenuManagementScreen({ onBackToOverview }: MenuManagementScreenProps) {
  const { menu, toggleItemAvailability, addNewMenuItem, updateMenuItem } = useRestaurant();
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State for new/edit item
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [station, setStation] = useState<Station>('kitchen');
  const [price, setPrice] = useState('8500');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  );

  const filteredMenu = menu.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const availableCount = menu.filter((i) => i.available).length;
  const outOfStockCount = menu.filter((i) => !i.available).length;

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name,
        category,
        station,
        price: parseInt(price, 10) || 1000,
        description,
        image: image || editingItem.image,
      });
      setEditingItem(null);
    } else {
      addNewMenuItem({
        name,
        category,
        station,
        price: parseInt(price, 10) || 1000,
        description,
        image:
          image ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        available: true,
        preparationTimeMins: 15,
        addOns: [],
      });
      setShowAddModal(false);
    }

    // Reset fields
    setName('');
    setDescription('');
    setPrice('8500');
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setStation(item.station);
    setPrice(item.price.toString());
    setDescription(item.description);
    setImage(item.image);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#211F1B] pb-24 font-sans">
      {/* Header */}
      <header className="bg-[#211F1B] text-white px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToOverview}
              className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">Live Menu Catalog</h1>
              <p className="text-[11px] text-[#AAA298]">
                Real-time stock availability &amp; pricing control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingItem(null);
                setName('');
                setDescription('');
                setPrice('8500');
                setShowAddModal(true);
              }}
              className="py-2.5 px-4 bg-[#C9532F] hover:bg-[#B54624] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Dish / Drink</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-6 pt-6 space-y-4">
        {/* Controls Bar: Search, Category Filters, Stats */}
        <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#DDD6CA] shadow-2xs flex flex-wrap items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-[#F5F0E7] p-1 rounded-2xl">
            {(
              [
                { key: 'all', label: 'All Items' },
                { key: 'food', label: 'Food' },
                { key: 'drinks', label: 'Drinks' },
                { key: 'desserts', label: 'Desserts' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeCategory === cat.key
                    ? 'bg-[#211F1B] text-white shadow-2xs'
                    : 'text-[#777067] hover:text-[#211F1B]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#777067] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog items…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl pl-9 pr-4 py-2 text-xs text-[#211F1B] focus:outline-none focus:ring-2 focus:ring-[#C9532F]/20 focus:border-[#211F1B]"
            />
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#166534] bg-[#EBF7EE] border border-[#BBF7D0] px-3 py-1 rounded-full font-bold">
              {availableCount} In Stock
            </span>
            <span className="text-[#777067] bg-[#EDE8DF] border border-[#DDD6CA] px-3 py-1 rounded-full font-bold">
              {outOfStockCount} Sold Out
            </span>
          </div>
        </div>

        {/* Menu Items Table / Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className={`bg-[#FFFDF9] rounded-2xl p-4 border transition-all shadow-2xs flex flex-col justify-between ${
                item.available ? 'border-[#DDD6CA]' : 'border-[#DDD6CA] opacity-80 bg-[#FAF8F5]'
              }`}
            >
              <div>
                <div className="flex items-start gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#DDD6CA]/60 bg-[#EDE8DF]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-extrabold text-sm text-[#211F1B] leading-tight truncate">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => openEdit(item)}
                        className="text-[#777067] hover:text-[#211F1B] p-1 cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#777067] line-clamp-2 mt-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono font-bold text-xs text-[#C9532F] tabular-nums">
                        {formatKwacha(item.price)}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#777067] bg-[#EDE8DF] px-2 py-0.5 rounded">
                        {item.station}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instant Stock Availability Toggle Control */}
              <div className="mt-4 pt-3 border-t border-[#DDD6CA]/60 flex items-center justify-between">
                <span className="text-xs font-bold text-[#211F1B]">
                  {item.available ? (
                    <span className="text-[#166534] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Available on QR
                    </span>
                  ) : (
                    <span className="text-[#777067] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Sold Out
                    </span>
                  )}
                </span>

                <button
                  onClick={() => toggleItemAvailability(item.id)}
                  className={`px-3 py-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                    item.available
                      ? 'bg-[#EBF7EE] text-[#166534] hover:bg-[#DCFCE7]'
                      : 'bg-[#EDE8DF] text-[#777067] hover:bg-[#DDD6CA]'
                  }`}
                >
                  {item.available ? 'Toggle Sold Out' : 'Mark Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add / Edit Item Modal */}
      {(showAddModal || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FFFDF9] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#DDD6CA] text-[#211F1B]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD6CA]">
              <h3 className="text-base font-extrabold">
                {editingItem ? 'Edit Menu Item' : 'Add New Item to Menu'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                }}
                className="text-[#777067] hover:text-[#211F1B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="py-4 space-y-3">
              <div>
                <label className="text-xs font-extrabold text-[#777067] block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chambo Fillet &amp; Fries"
                  className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs text-[#211F1B] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-extrabold text-[#777067] block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs text-[#211F1B]"
                  >
                    <option value="food">Food</option>
                    <option value="drinks">Drinks</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-[#777067] block mb-1">Station</label>
                  <select
                    value={station}
                    onChange={(e) => setStation(e.target.value as Station)}
                    className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs text-[#211F1B]"
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#777067] block mb-1">Price (MWK)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs text-[#211F1B] font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#777067] block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#F5F0E7] border border-[#DDD6CA] rounded-xl px-3 py-2 text-xs text-[#211F1B] resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 py-2.5 text-xs font-bold text-[#777067] bg-[#EDE8DF] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#C9532F] hover:bg-[#B54624] rounded-xl cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Publish Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
