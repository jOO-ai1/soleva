import React from 'react';
import CollectionPage from '../components/CollectionPage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTranslation } from 'react-i18next';

const CollectionsPage: React.FC = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('collections.pageTitle'));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('collections.pageTitle')}
          </h1>
          <p className="text-xl opacity-90">
            {t('collections.pageDescription')}
          </p>
        </div>
      </div>
      <CollectionPage />
    </div>);

};

export default CollectionsPage;