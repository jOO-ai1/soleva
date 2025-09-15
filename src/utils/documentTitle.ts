/**
 * Document Title Utility
 * Manages page titles consistently across the application
 */

const BASE_TITLE = 'Soleva – Luxury Footwear';

/**
 * Set the document title with optional page suffix
 * @param pageTitle - Optional page-specific title
 * @param includeBase - Whether to include the base title (default: true)
 */
export function setDocumentTitle(pageTitle?: string, includeBase: boolean = true): void {
  if (pageTitle && includeBase) {
    document.title = `${pageTitle} | ${BASE_TITLE}`;
  } else if (pageTitle) {
    document.title = pageTitle;
  } else {
    document.title = BASE_TITLE;
  }
}

/**
 * Get the base title
 */
export function getBaseTitle(): string {
  return BASE_TITLE;
}

/**
 * Common page titles
 */
export const PAGE_TITLES = {
  HOME: 'Home',
  PRODUCTS: 'Products',
  PRODUCT: 'Product',
  CART: 'Shopping Cart',
  CHECKOUT: 'Checkout',
  ACCOUNT: 'My Account',
  ORDERS: 'My Orders',
  LOGIN: 'Sign In',
  REGISTER: 'Create Account',
  ABOUT: 'About Us',
  CONTACT: 'Contact Us',
  PRIVACY: 'Privacy Policy',
  TERMS: 'Terms of Service',
  FAVORITES: 'My Favorites',
  ORDER_TRACKING: 'Track Order',
  ORDER_CONFIRMATION: 'Order Confirmation',
  COLLECTION: 'Collection',
} as const;

/**
 * Set title for specific pages
 */
export function setPageTitle(page: keyof typeof PAGE_TITLES, customTitle?: string): void {
  const title = customTitle || PAGE_TITLES[page];
  setDocumentTitle(title);
}

/**
 * Reset to base title
 */
export function resetTitle(): void {
  setDocumentTitle();
}
