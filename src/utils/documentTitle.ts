/**
 * Document Title Management Utility
 */

export const setDocumentTitle = (pageTitle?: string) => {
  const baseTitle = 'Soleva - Premium Footwear';
  
  if (pageTitle) {
    document.title = `${pageTitle} | ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
};

export const getPageTitle = (route: string): string => {
  const titleMap: Record<string, string> = {
    '/': 'Home',
    '/products': 'Products',
    '/about': 'About Us',
    '/contact': 'Contact',
    '/cart': 'Shopping Cart',
    '/favorites': 'Favorites',
    '/account': 'My Account',
    '/orders': 'My Orders',
    '/login': 'Login',
    '/register': 'Register',
    '/checkout': 'Checkout'
  };

  return titleMap[route] || 'Page';
};
