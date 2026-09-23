import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Flame, Filter, ArrowRight, PackageOpen } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR } from '../lib/formatters';

export const ShopPage: React.FC = () => {
  const { category: categorySlug } = useParams<{ category?: string }>();
  const { products, categories } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const currentCategory = useMemo(() => {
    if (!categorySlug) return null;
    return categories.find((c) => c.slug === categorySlug) || null;
  }, [categorySlug, categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (categorySlug && currentCategory) {
        if (p.categoryId !== currentCategory.id) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.shortDescription.toLowerCase().includes(q);
        const matchCat = p.categoryName?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    }).sort((a, b) => {
      if (selectedSort === 'price-asc') return a.basePrice - b.basePrice;
      if (selectedSort === 'price-desc') return b.basePrice - a.basePrice;
      return (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0);
    });
  }, [products, categorySlug, currentCategory, searchQuery, selectedSort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Category Header Banner */}
      <div className="bg-white rounded border border-[#E6E0D6] p-6 sm:p-8 space-y-2 relative overflow-hidden">
        <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
          {currentCategory ? 'Category Catalogue' : 'Commercial Print Products'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
          {currentCategory ? currentCategory.name : 'All Products & Services'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          {currentCategory
            ? currentCategory.description
            : 'Explore our comprehensive printing catalogue. Configure paper stocks, volume quantities, and finishes with live pricing.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter */}
        <div className="space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E6E0D6] rounded focus:outline-hidden focus:border-[#0F1B2D]"
            />
          </div>

          {/* Categories List */}
          <div className="bg-white rounded border border-[#E6E0D6] p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F1B2D] border-b border-[#E6E0D6] pb-2">
              <Filter className="w-3.5 h-3.5 text-[#D6342C]" />
              <span>Categories</span>
            </div>

            <ul className="space-y-1 text-xs">
              <li>
                <Link
                  to="/shop"
                  className={`block px-2.5 py-1.5 rounded transition-colors ${
                    !categorySlug
                      ? 'bg-[#0F1B2D] text-white font-semibold'
                      : 'text-slate-600 hover:bg-[#FAF8F5] hover:text-[#0F1B2D]'
                  }`}
                >
                  All Categories ({products.length})
                </Link>
              </li>

              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                const isSelected = categorySlug === cat.slug;
                return (
                  <li key={cat.id}>
                    <Link
                      to={`/shop/${cat.slug}`}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                        isSelected
                          ? 'bg-[#0F1B2D] text-white font-semibold'
                          : 'text-slate-600 hover:bg-[#FAF8F5] hover:text-[#0F1B2D]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        ({count})
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded border border-[#E6E0D6]">
            <div className="text-xs text-slate-500">
              Showing <strong className="text-[#0F1B2D]">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs text-slate-500">Sort by:</label>
              <select
                id="sort-select"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as any)}
                className="text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded px-2.5 py-1.5 text-slate-800 focus:outline-hidden"
              >
                <option value="featured">Featured / Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Empty State (e.g. Stickers category) */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded border border-[#E6E0D6] p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#0F1B2D]">
                {categorySlug === 'stickers'
                  ? 'Stickers Catalogue Updating'
                  : 'No products matched your search'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {categorySlug === 'stickers'
                  ? 'Our product line for die-cut label stickers and barcode labels is being updated. You can request an instant custom quote right now.'
                  : 'Try clearing your search query or select another category from the sidebar.'}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  to="/quote"
                  className="px-4 py-2 bg-[#D6342C] text-white text-xs font-bold rounded shadow-xs hover:bg-[#B8251E] transition-colors"
                >
                  Request Custom Quote
                </Link>
                <Link
                  to="/shop"
                  className="px-4 py-2 border border-[#0F1B2D] text-[#0F1B2D] text-xs font-semibold rounded hover:bg-slate-50 transition-colors"
                >
                  View All Products
                </Link>
              </div>
            </div>
          ) : (
            /* Product Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded border border-[#E6E0D6] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                      <img
                        src={prod.images[0]?.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {prod.isHot && (
                        <span className="absolute top-2.5 left-2.5 bg-[#D6342C] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-current" />
                          Hot
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        {prod.categoryName}
                      </div>
                      <h3 className="font-bold text-base text-[#0F1B2D] leading-snug group-hover:text-[#D6342C] transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {prod.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">From</div>
                      <div className="text-sm font-bold text-[#0F1B2D]">
                        {formatLKR(prod.basePrice)}
                      </div>
                    </div>
                    <Link
                      to={`/product/${prod.slug}`}
                      className="px-3.5 py-1.5 bg-[#0F1B2D] hover:bg-[#D6342C] text-white text-xs font-semibold rounded flex items-center gap-1 transition-colors"
                    >
                      <span>Configure</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
