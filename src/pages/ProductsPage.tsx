import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiGrid, FiList, FiFilter, FiSearch } from "react-icons/fi";
import { useLang } from "../contexts/LangContext";
import { useProducts } from "../hooks/useApi";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import SectionTitle from "../components/SectionTitle";
import clsx from "clsx";

type Localized = Record<string, string>;

interface ProductDTO {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  images: string[] | string;
  basePrice: number | string;
  salePrice?: number | string | null;
  isFeatured?: boolean;
  category?: {slug?: string;} | null;
  collection?: {slug?: string;} | null;
}

export const ProductsPage: React.FC = () => {
  const { lang } = useLang();
  const t = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const collectionParam = searchParams.get("collection");

  const [selectedCategory, setSelectedCategory] = useState(collectionParam || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high">("name");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch products from API
  const { data: productsResponse, loading: productsLoading, error: productsError } = useProducts();
  const products: ProductDTO[] = Array.isArray(productsResponse) ? productsResponse : productsResponse?.data || [];

  const categories = [
  { id: "all", label: lang === "ar" ? "الكل" : "All" },
  { id: "mens", label: lang === "ar" ? "رجالي" : "Men's" },
  { id: "womens", label: lang === "ar" ? "نسائي" : "Women's" },
  { id: "basics", label: lang === "ar" ? "أساسي" : "Essentials" }];


  const sortOptions = [
  { id: "name", label: lang === "ar" ? "الاسم" : "Name" },
  { id: "price-low", label: lang === "ar" ? "السعر: من الأقل للأعلى" : "Price: Low to High" },
  { id: "price-high", label: lang === "ar" ? "السعر: من الأعلى للأقل" : "Price: High to Low" }];


  useEffect(() => {
    if (collectionParam && collectionParam !== selectedCategory) {
      setSelectedCategory(collectionParam);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [collectionParam, selectedCategory]);

  // Handle category change and update URL
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === "all") {
      navigate("/products", { replace: true });
    } else {
      navigate(`/products?collection=${categoryId}`, { replace: true });
    }
  };
  // Filter and sort products
  let filteredProducts: ProductDTO[] = selectedCategory === "all" ?
  products :
  products.filter((p: ProductDTO) => {
    if (selectedCategory === "mens") return p.category?.slug === "mens-shoes";
    if (selectedCategory === "womens") return p.category?.slug === "womens-shoes";
    if (selectedCategory === "basics") return p.collection?.slug === "essentials";
    return false;
  });

  // Apply search filter
  if (searchQuery.trim()) {
    filteredProducts = filteredProducts.filter((product: ProductDTO) =>
    product.name[lang]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description[lang]?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply price filter
  filteredProducts = filteredProducts.filter(
    (p: ProductDTO) => Number(p.basePrice) >= priceRange[0] && Number(p.basePrice) <= priceRange[1]
  );

  // Apply sorting
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return Number(a.basePrice) - Number(b.basePrice);
      case "price-high":
        return Number(b.basePrice) - Number(a.basePrice);
      default:
        return a.name[lang]?.localeCompare(b.name[lang] || "") || 0;
    }
  });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12">

          <SectionTitle className="mb-4">
            {selectedCategory === "all" ?
            t("products") :
            categories.find((c) => c.id === selectedCategory)?.label || t("products")
            }
          </SectionTitle>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            {lang === 'ar' ?
            'اكتشف مجموعتنا المتنوعة من الأحذية عالية الجودة' :
            'Discover our diverse collection of premium quality footwear'
            }
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1">

            <GlassCard className="sticky top-24">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FiFilter />
                {lang === "ar" ? "تصفية" : "Filters"}
              </h2>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  {lang === "ar" ? "البحث" : "Search"}
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full form-input pl-10"
                    placeholder={lang === "ar" ? "ابحث عن المنتجات..." : "Search products..."} />

                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-text-primary">
                  {lang === "ar" ? "الفئة" : "Category"}
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) =>
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={clsx(
                      "w-full text-left px-4 py-3 rounded-lg transition-all duration-200",
                      selectedCategory === cat.id ?
                      "bg-primary text-black font-semibold shadow-md" :
                      "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                    )}>

                      {cat.label}
                    </button>
                  )}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-text-primary">
                  {lang === "ar" ? "السعر" : "Price Range"}
                </h3>
                <div className="space-y-3">
                  <input
                    type="range"
                    min={0}
                    max={5000}
                    step={100}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                    className="w-full accent-primary" />

                  <div className="flex justify-between text-sm text-text-secondary">
                    <span>0 {t("egp")}</span>
                    <span>{priceRange[1]} {t("egp")}</span>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <GlassButton
                onClick={() => {
                  handleCategoryChange("all");
                  setPriceRange([0, 5000]);
                  setSearchQuery("");
                  setSortBy("name");
                }}
                variant="ghost"
                className="w-full">

                {lang === "ar" ? "مسح الفلاتر" : "Clear Filters"}
              </GlassButton>
            </GlassCard>
          </motion.aside>

          {/* Products Section */}
          <div className="lg:col-span-3">
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap justify-between items-center mb-8 gap-4">

              {/* Sort Options */}
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) =>
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id as any)}
                  className={clsx(
                    "px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                    sortBy === option.id ?
                    "bg-primary text-black shadow-md" :
                    "modern-glass-button hover:bg-primary hover:text-black"
                  )}>

                    {option.label}
                  </button>
                )}
              </div>

              {/* View Mode & Results Count */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary">
                  {filteredProducts.length} {lang === "ar" ? "منتج" : "products"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={clsx(
                      "p-2 rounded-lg transition-all duration-200",
                      viewMode === "grid" ?
                      "bg-primary text-black" :
                      "modern-glass-button hover:bg-primary hover:text-black"
                    )}
                    aria-label="Grid view">

                    <FiGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={clsx(
                      "p-2 rounded-lg transition-all duration-200",
                      viewMode === "list" ?
                      "bg-primary text-black" :
                      "modern-glass-button hover:bg-primary hover:text-black"
                    )}
                    aria-label="List view">

                    <FiList size={18} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Loading State */}
            {productsLoading ?
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16">

                <GlassCard className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">⏳</div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">
                    {lang === "ar" ? "جاري التحميل..." : "Loading..."}
                  </h3>
                  <p className="text-text-secondary">
                    {lang === "ar" ?
                  "جاري جلب المنتجات" :
                  "Fetching products"
                  }
                  </p>
                </GlassCard>
              </motion.div> :
            productsError ?
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16">

                <GlassCard className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">❌</div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">
                    {lang === "ar" ? "خطأ في التحميل" : "Loading Error"}
                  </h3>
                  <p className="text-text-secondary">
                    {lang === "ar" ?
                  "حدث خطأ أثناء جلب المنتجات. يرجى المحاولة مرة أخرى." :
                  "An error occurred while fetching products. Please try again."
                  }
                  </p>
                </GlassCard>
              </motion.div> :
            filteredProducts.length === 0 ?
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16">

                <GlassCard className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">
                    {lang === "ar" ? "لا توجد منتجات" : "No Products Found"}
                  </h3>
                  <p className="text-text-secondary">
                    {lang === "ar" ?
                  "جرب تغيير الفلاتر أو البحث عن شيء آخر" :
                  "Try adjusting your filters or search for something else"
                  }
                  </p>
                </GlassCard>
              </motion.div> :

            <motion.div
              layout
              className={clsx(
                "gap-6",
                viewMode === "grid" ?
                "products-grid" :
                "flex flex-col space-y-6"
              )}>

                {filteredProducts.map((product: ProductDTO, index: number) =>
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={clsx(
                  "product-card group interactive-hover",
                  viewMode === "list" && "flex flex-row items-center gap-6 p-6"
                )}>

                    <Link to={`/product/${product.slug}`} className="block h-full">
                      <div className={clsx(
                    "product-card-image relative overflow-hidden",
                    viewMode === "list" && "w-48 h-48 flex-shrink-0"
                  )}>
                        <img
                      src={Array.isArray(product.images) ? product.images[0] : product.images}
                      alt={product.name[lang] || product.name.en}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading={index < 6 ? "eager" : "lazy"}
                      decoding="async"
                      width="300"
                      height="300" />

                        {/* Favorites disabled for API products with string IDs */}
                      </div>
                      
                      <div className={clsx(
                    "product-card-content",
                    viewMode === "list" && "flex-1"
                  )}>
                        <h3 className="product-card-title">
                          {product.name[lang] || product.name.en}
                        </h3>
                        <p className="product-card-description line-clamp-2">
                          {product.description[lang] || product.description.en}
                        </p>
                        <div className="product-card-price">
                          {product.salePrice ?
                      <>
                              <span className="line-through text-text-secondary mr-2">
                                {Number(product.basePrice)} {t("egp")}
                              </span>
                              <span className="text-primary font-semibold">
                                {Number(product.salePrice)} {t("egp")}
                              </span>
                            </> :

                      <span>{Number(product.basePrice)} {t("egp")}</span>
                      }
                        </div>
                        <div className="product-card-actions">
                          <GlassButton
                        variant="primary"
                        className="w-full text-[#000000]">

                            {t("viewDetails")}
                          </GlassButton>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
              )}
              </motion.div>
            }
          </div>
        </div>
      </div>
    </div>);

};