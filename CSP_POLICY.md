# Content Security Policy (CSP) Configuration

## Production CSP Policy

The following CSP policy is configured for production deployment:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://www.gstatic.com https://connect.facebook.net https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
img-src 'self' data: https: blob: https://www.google-analytics.com https://www.googletagmanager.com;
connect-src 'self' https://api.solevaeg.com https://www.google-analytics.com https://analytics.google.com https://accounts.google.com https://www.googletagmanager.com https://connect.facebook.net https://graph.facebook.com;
frame-src 'self' https://accounts.google.com https://www.facebook.com;
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

## Development CSP Policy

For development, the CSP is more permissive:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com https://connect.facebook.net https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
img-src 'self' data: https: blob: https://www.google-analytics.com https://www.googletagmanager.com;
connect-src 'self' https://api.solevaeg.com https://www.google-analytics.com https://analytics.google.com https://accounts.google.com https://www.googletagmanager.com https://connect.facebook.net https://graph.facebook.com http://localhost:3001;
frame-src 'self' https://accounts.google.com https://www.facebook.com;
object-src 'none';
base-uri 'self';
form-action 'self';
```

## CSP Directives Explained

### script-src
- `'self'`: Allow scripts from the same origin
- `'unsafe-inline'`: Allow inline scripts (required for some libraries)
- `'unsafe-eval'`: Allow eval() (required for some libraries)
- `https://accounts.google.com`: Google OAuth
- `https://www.googletagmanager.com`: Google Tag Manager
- `https://www.google-analytics.com`: Google Analytics
- `https://www.gstatic.com`: Google static resources
- `https://connect.facebook.net`: Facebook SDK
- `https://cdn.jsdelivr.net`: CDN for libraries

### style-src
- `'self'`: Allow styles from the same origin
- `'unsafe-inline'`: Allow inline styles (required for dynamic styling)
- `https://fonts.googleapis.com`: Google Fonts
- `https://cdn.jsdelivr.net`: CDN for stylesheets

### font-src
- `'self'`: Allow fonts from the same origin
- `https://fonts.gstatic.com`: Google Fonts
- `https://cdn.jsdelivr.net`: CDN for fonts

### img-src
- `'self'`: Allow images from the same origin
- `data:`: Allow data URLs for images
- `https:`: Allow HTTPS images from any domain
- `blob:`: Allow blob URLs for images
- `https://www.google-analytics.com`: Google Analytics tracking pixels
- `https://www.googletagmanager.com`: Google Tag Manager tracking pixels

### connect-src
- `'self'`: Allow connections to the same origin
- `https://api.solevaeg.com`: API endpoints
- `https://www.google-analytics.com`: Google Analytics
- `https://analytics.google.com`: Google Analytics
- `https://accounts.google.com`: Google OAuth
- `https://www.googletagmanager.com`: Google Tag Manager
- `https://connect.facebook.net`: Facebook SDK
- `https://graph.facebook.com`: Facebook Graph API

### frame-src
- `'self'`: Allow frames from the same origin
- `https://accounts.google.com`: Google OAuth popup
- `https://www.facebook.com`: Facebook OAuth popup

### Security Directives
- `object-src 'none'`: Block all object, embed, and applet elements
- `base-uri 'self'`: Restrict base element to same origin
- `form-action 'self'`: Restrict form submissions to same origin
- `upgrade-insecure-requests`: Upgrade HTTP requests to HTTPS

## Implementation

The CSP is implemented in two places:

1. **Backend (Express.js)**: In `backend/src/server.ts` using Helmet middleware
2. **Nginx**: In `docker/nginx/conf.d/solevaeg.conf` as HTTP headers

## Monitoring

To monitor CSP violations in production:

1. Enable CSP reporting by adding `report-uri` directive
2. Set up a reporting endpoint to collect violations
3. Monitor and adjust policy based on legitimate violations

## Security Considerations

1. **'unsafe-inline' and 'unsafe-eval'**: These are required for some libraries but reduce security. Consider using nonces or hashes for better security.

2. **Third-party domains**: Only include trusted third-party domains that are necessary for functionality.

3. **Regular review**: Regularly review and update the CSP policy as the application evolves.

4. **Testing**: Test the CSP policy thoroughly in staging before deploying to production.

## Future Improvements

1. Implement nonce-based CSP for inline scripts
2. Use hash-based CSP for specific inline styles
3. Implement CSP reporting for violation monitoring
4. Consider implementing Subresource Integrity (SRI) for third-party resources
