import React from 'react';
import Categories from '../components/Categories';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';

const CategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('categories.pageTitle'));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('categories.pageTitle')}
          </h1>
          <p className="text-xl opacity-90">
            {t('categories.pageDescription')}
          </p>
        </div>
      </div>
      <Categories />
    </div>
  );
};

export default CategoriesPage;