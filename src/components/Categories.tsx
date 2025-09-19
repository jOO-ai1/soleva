import React from 'react';
import { motion } from 'framer-motion';
import { useCategories } from '../hooks/useApi';
import { useTranslation } from 'react-i18next';

const Categories: React.FC = () => {
  const { data: categories, loading, error } = useCategories();
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) =>
          <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
          )}
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{t('error.loadingCategories')}</p>
        </div>
      </div>);

  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          {t('categories.title')}
        </h2>
        <p className="text-gray-600 mt-2">
          {t('categories.subtitle')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category, index) =>
        <motion.div
          key={category.id}
          className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}>

            <div className="relative h-48 overflow-hidden">
              <img
              src={category.image}
              alt={category.name[i18n.language] || category.name.en}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />

            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {category.name[i18n.language] || category.name.en}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {category.description?.[i18n.language] || category.description?.en}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {category.productsCount} {t('categories.products')}
                </span>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  {t('common.viewAll')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>);

};

export default Categories;