import React from 'react';
import { Helmet } from 'react-helmet-async';

interface Product {
  id: string;
  name: { ar: string; en: string };
  price: number;
  image: string;
  desc: { ar: string; en: string };
  specs: { ar: string; en: string };
  collection: string;
  colors: string[];
  sizes: string[];
}

interface StructuredDataProps {
  type: 'organization' | 'product' | 'breadcrumb' | 'website';
  data?: any;
  product?: Product;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data, product, breadcrumbs }) => {
  const getOrganizationSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Soleva",
      "alternateName": "سوليفا",
      "url": "https://solevaeg.com",
      "logo": "https://solevaeg.com/logo.png",
      "description": {
        "@type": "Text",
        "@language": "en",
        "@value": "Premium luxury shoe brand offering exclusive footwear collections with sophisticated design and exceptional quality."
      },
      "sameAs": [
        "https://www.facebook.com/solevaeg",
        "https://www.instagram.com/soleva.eg/"
        // Twitter hidden but kept for future use
        // "https://twitter.com/solevaeg"
      ],
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "email": "support@solevaeg.com",
          "contactType": "customer service",
          "availableLanguage": ["English", "Arabic"]
        },
        {
          "@type": "ContactPoint",
          "email": "sales@solevaeg.com",
          "contactType": "sales",
          "availableLanguage": ["English", "Arabic"]
        },
        {
          "@type": "ContactPoint",
          "email": "business@solevaeg.com",
          "contactType": "business partnerships",
          "availableLanguage": ["English", "Arabic"]
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "EG",
        "addressLocality": "Cairo",
        "addressRegion": "Cairo Governorate"
      },
      "founder": {
        "@type": "Person",
        "name": "Soleva Founders"
      },
      "foundingDate": "2024",
      "industry": "Fashion & Footwear",
      "numberOfEmployees": "10-50",
      "areaServed": {
        "@type": "Country",
        "name": "Egypt"
      },
      "paymentAccepted": ["Cash", "Bank Transfer", "Digital Wallet"],
      "priceRange": "$$-$$$",
      "currenciesAccepted": "EGP"
    };
  };

  const getProductSchema = () => {
    if (!product) return null;

    const currentLang = document.documentElement.lang || 'en';
    const productName = product.name[currentLang as keyof typeof product.name];
    const productDescription = product.desc[currentLang as keyof typeof product.desc];

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": productName,
      "description": productDescription,
      "image": [
        `https://solevaeg.com${product.image}`,
        `https://solevaeg.com${product.image.replace('.jpg', '_2.jpg')}`,
        `https://solevaeg.com${product.image.replace('.jpg', '_3.jpg')}`
      ],
      "sku": product.id,
      "mpn": product.id,
      "brand": {
        "@type": "Brand",
        "name": "Soleva"
      },
      "category": "Footwear",
      "color": product.colors,
      "size": product.sizes,
      "material": "Premium Leather",
      "offers": {
        "@type": "Offer",
        "url": `https://solevaeg.com/products/${product.id}`,
        "priceCurrency": "EGP",
        "price": product.price,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Soleva"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "45",
            "currency": "EGP"
          },
          "shippingDestination": {
            "@type": "DefinedRegion",
            "addressCountry": "EG"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 3,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 2,
              "maxValue": 7,
              "unitCode": "DAY"
            }
          }
        },
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "EG",
          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays": 14,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [
        {
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5"
          },
          "author": {
            "@type": "Person",
            "name": "Ahmed M."
          },
          "reviewBody": currentLang === 'ar' 
            ? "جودة ممتازة وتصميم أنيق جداً. أنصح بالشراء."
            : "Excellent quality and very elegant design. Highly recommend.",
          "datePublished": "2024-01-15"
        }
      ],
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Collection",
          "value": product.collection
        },
        {
          "@type": "PropertyValue", 
          "name": "Gender",
          "value": "Unisex"
        },
        {
          "@type": "PropertyValue",
          "name": "Season",
          "value": "All Season"
        }
      ]
    };
  };

  const getBreadcrumbSchema = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": breadcrumb.name,
        "item": `https://solevaeg.com${breadcrumb.url}`
      }))
    };
  };

  const getWebsiteSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Soleva",
      "alternateName": "سوليفا",
      "url": "https://solevaeg.com",
      "description": "Premium luxury shoe brand offering exclusive footwear collections",
      "publisher": {
        "@type": "Organization",
        "name": "Soleva"
      },
      "potentialAction": [
        {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://solevaeg.com/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      ],
      "sameAs": [
        "https://www.facebook.com/solevaeg",
        "https://www.instagram.com/soleva.eg/"
        // Twitter hidden but kept for future use
        // "https://twitter.com/solevaeg"
      ]
    };
  };

  const getEcommerceSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "name": "Soleva Online Store",
      "url": "https://solevaeg.com",
      "description": "Premium luxury shoes online store in Egypt",
      "currenciesAccepted": "EGP",
      "paymentAccepted": [
        "Cash on Delivery",
        "Bank Transfer", 
        "Digital Wallet"
      ],
      "areaServed": {
        "@type": "Country",
        "name": "Egypt"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Soleva Product Catalog",
        "itemListElement": [
          {
            "@type": "OfferCatalog",
            "name": "Men's Shoes",
            "itemListElement": []
          },
          {
            "@type": "OfferCatalog", 
            "name": "Women's Shoes",
            "itemListElement": []
          },
          {
            "@type": "OfferCatalog",
            "name": "Luxury Collection",
            "itemListElement": []
          }
        ]
      }
    };
  };

  const getFAQSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What payment methods do you accept?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We accept Cash on Delivery (COD), Bank Wallet Transfer, and Digital Wallets like Vodafone Cash."
          }
        },
        {
          "@type": "Question",
          "name": "Do you offer free shipping?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, we offer free shipping on orders over 500 EGP to all governorates in Egypt."
          }
        },
        {
          "@type": "Question",
          "name": "What is your return policy?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We offer 14-day returns for unworn items in original packaging. Returns are free of charge."
          }
        },
        {
          "@type": "Question",
          "name": "How long does delivery take?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Delivery typically takes 2-7 business days depending on your location in Egypt."
          }
        }
      ]
    };
  };

  const getSchema = () => {
    switch (type) {
      case 'organization':
        return getOrganizationSchema();
      case 'product':
        return getProductSchema();
      case 'breadcrumb':
        return getBreadcrumbSchema();
      case 'website':
        return [getWebsiteSchema(), getEcommerceSchema(), getFAQSchema()];
      default:
        return null;
    }
  };

  const schema = getSchema();
  
  if (!schema) return null;

  const schemaArray = Array.isArray(schema) ? schema : [schema];

  return (
    <Helmet>
      {schemaArray.map((schemaItem, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaItem, null, 2)
          }}
        />
      ))}
    </Helmet>
  );
};

export default StructuredData;
