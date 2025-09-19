import React from 'react';
import { motion } from 'framer-motion';
import { useCollections } from '../hooks/useApi';
import { useTranslation } from 'react-i18next';

const CollectionPage: React.FC = () => {
  const { data: collections, loading, error } = useCollections();
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{t('error.loadingCollections')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          {t('collections.title')}
        </h2>
        <p className="text-gray-600 mt-2">
          {t('collections.subtitle')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {collections?.map((collection, index) => (
          <motion.div
            key={collection.id}
            className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="relative h-56 overflow-hidden">
              <img
                src={collection.image}
                alt={collection.name[i18n.language] || collection.name.en}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {collection.isFeatured && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {t('collections.featured')}
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {collection.name[i18n.language] || collection.name.en}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {collection.description?.[i18n.language] || collection.description?.en}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {collection.productsCount} {t('collections.products')}
                </span>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  {t('common.explore')}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CollectionPage;