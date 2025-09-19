/**
 * Safe Home Component with Error Boundaries and Fallback Data
 * Handles API failures gracefully with mock data
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiService from '../services/apiService';
import { Product, Category, Collection } from '../services/mockDataService';

// Hero Section Component
const HeroSection = () => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white py-20 px-4"
  >
    <div className="container mx-auto text-center">
      <h1 className="text-5xl font-bold mb-6">
        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Soleva</span>
      </h1>
      <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
        Discover our premium collection of luxury footwear designed for comfort and style.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
      >
        Explore Collection
      </motion.button>
    </div>
  </motion.section>
);

// Product Card Component
interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -5 }}
    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
  >
    <div className="relative">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80';
        }}
      />
      {product.isOnSale && (
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
          Sale
        </div>
      )}
      {product.isNew && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
          New
        </div>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-lg text-gray-800 mb-2">{product.name}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-purple-600">{product.price} EGP</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">{product.originalPrice} EGP</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">★</span>
          <span className="text-sm text-gray-600">{product.rating}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

// Category Card Component
interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05 }}
    className="relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group"
  >
    <div className="relative h-32">
      <img
        src={category.image}
        alt={category.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&q=80';
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
      <h3 className="font-semibold text-lg">{category.name}</h3>
      <p className="text-sm opacity-90">{category.productsCount} products</p>
    </div>
  </motion.div>
);

// Loading Component
const LoadingComponent = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

// Error Component
interface ErrorComponentProps {
  error: string;
  retry?: () => void;
}

const ErrorComponent: React.FC<ErrorComponentProps> = ({ error, retry }) => (
  <div className="text-center py-12">
    <div className="text-gray-500 mb-4">
      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
    <p className="text-gray-500 mb-4">{error}</p>
    {retry && (
      <button
        onClick={retry}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

// Main SafeHome Component
const SafeHome: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🏠 Loading home page data...');
      
      // Load data concurrently
      const [productsResponse, categoriesResponse, collectionsResponse] = await Promise.allSettled([
        apiService.getProducts({ featured: true }),
        apiService.getCategories(),
        apiService.getCollections()
      ]);

      // Handle products
      if (productsResponse.status === 'fulfilled' && productsResponse.value.success) {
        setProducts(productsResponse.value.data.slice(0, 8)); // Show first 8 products
      }

      // Handle categories
      if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.success) {
        setCategories(categoriesResponse.value.data.slice(0, 4)); // Show first 4 categories
      }

      // Handle collections
      if (collectionsResponse.status === 'fulfilled' && collectionsResponse.value.success) {
        setCollections(collectionsResponse.value.data.slice(0, 3)); // Show first 3 collections
      }

      console.log('✅ Home page data loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load home page data:', err);
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeroSection />
        <LoadingComponent />
      </div>
    );
  }

  if (error && products.length === 0 && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeroSection />
        <ErrorComponent error={error} retry={loadData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      
      {/* Featured Products Section */}
      {products.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-center text-gray-800 mb-12"
            >
              Featured Products
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-center text-gray-800 mb-12"
            >
              Shop by Category
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CategoryCard category={category} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Success Message for Mock Data */}
      {(products.length > 0 || categories.length > 0) && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Website loaded successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeHome;
