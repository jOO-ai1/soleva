import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';
import { useLang } from '../contexts/LangContext';
import GlassButton from '../components/GlassButton';

export default function NotFoundPage() {
  const { lang } = useLang();

  return (
    <div className="container mx-auto py-20 px-4 text-center">
      <div className="text-8xl font-bold text-[#d1b16a] mb-4">404</div>
      <h1 className="text-3xl font-bold mb-6 text-[#111]">{lang === "ar" ? "الصفحة غير موجودة" : "Page Not Found"}</h1>
      <p className="text-gray-600 mb-8">
        {lang === "ar" ?
        "الصفحة التي تبحث عنها غير موجودة" :
        "The page you're looking for doesn't exist"
        }
      </p>
      <Link to="/">
        <GlassButton className="bg-[#d1b16a] text-black border-none hover:bg-[#d1b16a]/80">
          <FiHome />
          {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
        </GlassButton>
      </Link>
    </div>);

}