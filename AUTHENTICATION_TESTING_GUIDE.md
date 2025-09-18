# Authentication Testing Guide

## Overview

This guide provides comprehensive testing procedures for the enhanced authentication system with security hardening, Google OAuth fixes, CSP compliance, and improved error handling.

## Prerequisites

1. **Environment Setup**
   - Copy `env.sample` to `.env` and configure all required variables
   - Ensure Google OAuth credentials are properly configured
   - Set up CAPTCHA credentials (reCAPTCHA or hCaptcha)
   - Configure email service for verification emails

2. **Database Setup**
   - Run database migrations
   - Ensure all tables are created properly

## Testing Checklist

### A) Security Hardening Tests

#### 1. Password Policy Enforcement
- [ ] **Test weak passwords** (less than 12 characters)
  - Expected: Error message about minimum length
  - Arabic: "كلمة المرور يجب أن تكون 12 حرف على الأقل"
  - English: "Password must be at least 12 characters long"

- [ ] **Test passwords without uppercase**
  - Expected: Error about missing uppercase letter
  - Arabic: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل"
  - English: "Password must contain at least one uppercase letter"

- [ ] **Test passwords without lowercase**
  - Expected: Error about missing lowercase letter
  - Arabic: "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل"
  - English: "Password must contain at least one lowercase letter"

- [ ] **Test passwords without numbers**
  - Expected: Error about missing numbers
  - Arabic: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل"
  - English: "Password must contain at least one number"

- [ ] **Test passwords without special characters**
  - Expected: Error about missing special characters
  - Arabic: "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل"
  - English: "Password must contain at least one special character"

- [ ] **Test common passwords**
  - Try: "password", "123456", "qwerty"
  - Expected: Error about password being too common
  - Arabic: "كلمة المرور شائعة جداً، يرجى اختيار كلمة مرور أقوى"
  - English: "Password is too common, please choose a stronger password"

- [ ] **Test sequential characters**
  - Try: "abc123", "123456", "qwerty"
  - Expected: Error about sequential characters
  - Arabic: "كلمة المرور لا يمكن أن تحتوي على أحرف متتالية"
  - English: "Password cannot contain sequential characters"

- [ ] **Test keyboard patterns**
  - Try: "qwerty", "asdfgh", "zxcvbn"
  - Expected: Error about keyboard patterns
  - Arabic: "كلمة المرور لا يمكن أن تحتوي على أنماط لوحة المفاتيح"
  - English: "Password cannot contain keyboard patterns"

#### 2. Email Verification
- [ ] **Test registration without email verification**
  - Register with valid data
  - Expected: Account created but login blocked until verification
  - Message: "Please verify your email address before logging in"

- [ ] **Test email verification flow**
  - Check email for verification link
  - Click verification link
  - Expected: Email marked as verified
  - Login should now work

- [ ] **Test resend verification email**
  - Try to login with unverified account
  - Use resend verification option
  - Expected: New verification email sent

#### 3. Rate Limiting
- [ ] **Test login rate limiting**
  - Attempt 6 failed logins within 15 minutes
  - Expected: 429 error with retry time
  - Arabic: "عدد المحاولات تجاوز الحد. حاول لاحقًا"
  - English: "Too many attempts. Try again later"

- [ ] **Test registration rate limiting**
  - Attempt 4 registrations within 15 minutes
  - Expected: 429 error with retry time
  - Arabic: "عدد المحاولات تجاوز الحد. حاول لاحقًا"
  - English: "Too many attempts. Try again later"

#### 4. CAPTCHA Integration
- [ ] **Test CAPTCHA requirement**
  - Attempt login/registration without CAPTCHA token
  - Expected: Error about CAPTCHA requirement
  - Arabic: "يرجى إكمال التحقق من الأمان"
  - English: "Please complete the security verification"

- [ ] **Test CAPTCHA validation**
  - Submit invalid CAPTCHA token
  - Expected: Error about CAPTCHA failure
  - Arabic: "فشل في التحقق من الأمان"
  - English: "CAPTCHA verification failed"

### B) Google OAuth Tests

#### 1. Google Login Flow
- [ ] **Test successful Google login**
  - Click Google login button
  - Complete Google OAuth flow
  - Expected: Successful login with user data

- [ ] **Test Google login with new user**
  - Use Google account not in database
  - Expected: New user created automatically
  - User should be marked as verified

- [ ] **Test Google login with existing user**
  - Use Google account already in database
  - Expected: Existing user logged in
  - Google ID should be linked if not already

#### 2. Google OAuth Error Handling
- [ ] **Test invalid Google token**
  - Submit malformed Google credential
  - Expected: Error about invalid token
  - Arabic: "رمز جوجل غير صالح"
  - English: "Invalid Google token"

- [ ] **Test expired Google token**
  - Submit expired Google credential
  - Expected: Error about token expiration
  - Arabic: "انتهت صلاحية رمز جوجل، يرجى المحاولة مرة أخرى"
  - English: "Google token has expired, please try again"

- [ ] **Test unverified Google email**
  - Use Google account with unverified email
  - Expected: Error about email verification
  - Arabic: "يرجى التحقق من بريدك الإلكتروني في جوجل"
  - English: "Please verify your email in Google"

- [ ] **Test Google configuration error**
  - Test with missing Google Client ID
  - Expected: Error about configuration
  - Arabic: "خدمة تسجيل الدخول بجوجل غير متاحة حالياً"
  - English: "Google login service is currently unavailable"

### C) CSP & Mixed Content Tests

#### 1. CSP Compliance
- [ ] **Test script loading**
  - Check browser console for CSP violations
  - Expected: No CSP violations for allowed scripts
  - Google Analytics, GTM, Facebook SDK should load

- [ ] **Test image loading**
  - Check that images load properly
  - Expected: No CSP violations for images
  - Google Analytics tracking pixels should work

- [ ] **Test API connections**
  - Check network tab for API calls
  - Expected: All API calls use HTTPS
  - No mixed content warnings

#### 2. Mixed Content Prevention
- [ ] **Test HTTPS enforcement**
  - Check that all resources use HTTPS
  - Expected: No HTTP resources in production
  - Browser should not show mixed content warnings

### D) Frontend Error Handling Tests

#### 1. Login Error Messages
- [ ] **Test invalid credentials**
  - Enter wrong password
  - Expected: Clear error message
  - Arabic: "كلمة المرور غير صحيحة"
  - English: "Invalid password"

- [ ] **Test account not found**
  - Enter non-existent email
  - Expected: Helpful error message
  - Arabic: "الحساب غير مسجل. يمكنك إنشاء حساب جديد"
  - English: "Account not found. You can create a new one"

- [ ] **Test disabled account**
  - Try to login with disabled account
  - Expected: Clear error message
  - Arabic: "الحساب معطل، يرجى التواصل مع الدعم"
  - English: "Account is disabled, please contact support"

- [ ] **Test network errors**
  - Disconnect internet and try login
  - Expected: Network error message
  - Arabic: "تعذر الاتصال بالخادم"
  - English: "Unable to connect to the server"

#### 2. Registration Error Messages
- [ ] **Test email already exists**
  - Try to register with existing email
  - Expected: Clear error message
  - Arabic: "البريد الإلكتروني مسجل مسبقاً. يمكنك تسجيل الدخول أو استعادة كلمة المرور"
  - English: "Email already exists. You can login or reset your password"

- [ ] **Test weak password**
  - Enter weak password during registration
  - Expected: Detailed password requirements
  - Arabic: "كلمة المرور ضعيفة. يجب أن تحتوي على 12 حرف على الأقل مع أرقام ورموز"
  - English: "Password is too weak. Must be at least 12 characters with numbers and symbols"

#### 3. Loading States
- [ ] **Test loading indicators**
  - Submit login/registration form
  - Expected: Loading spinner appears
  - Form should be disabled during submission

- [ ] **Test loading state cleanup**
  - Submit form and wait for response
  - Expected: Loading spinner disappears
  - Form should be re-enabled

### E) Bilingual Support Tests

#### 1. Arabic Language
- [ ] **Test Arabic error messages**
  - Set browser language to Arabic
  - Trigger various errors
  - Expected: All error messages in Arabic

- [ ] **Test Arabic UI elements**
  - Check form labels and buttons
  - Expected: All UI elements in Arabic

#### 2. English Language
- [ ] **Test English error messages**
  - Set browser language to English
  - Trigger various errors
  - Expected: All error messages in English

- [ ] **Test English UI elements**
  - Check form labels and buttons
  - Expected: All UI elements in English

## Test Data

### Valid Test Accounts
```
Email: test@solevaeg.com
Password: TestPassword123!
Name: Test User

Email: admin@solevaeg.com
Password: AdminPassword123!
Name: Admin User
Role: ADMIN
```

### Invalid Test Data
```
Weak Passwords:
- "password"
- "123456"
- "qwerty"
- "abc123"
- "Password1"

Invalid Emails:
- "invalid-email"
- "test@"
- "@domain.com"
- "test..test@domain.com"

Common Passwords:
- "password"
- "123456"
- "qwerty"
- "admin"
- "letmein"
```

## Browser Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Firefox Mobile

### Screen Sizes
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Performance Testing

### Load Testing
- [ ] Test with 100 concurrent users
- [ ] Test rate limiting under load
- [ ] Test database performance

### Security Testing
- [ ] Test for SQL injection
- [ ] Test for XSS attacks
- [ ] Test for CSRF attacks
- [ ] Test for brute force attacks

## Monitoring

### Error Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor authentication failures
- [ ] Monitor rate limiting triggers

### Performance Monitoring
- [ ] Set up performance monitoring
- [ ] Monitor API response times
- [ ] Monitor database query performance

## Deployment Checklist

### Pre-deployment
- [ ] All tests pass
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Database migrations run
- [ ] CAPTCHA credentials configured
- [ ] Email service configured

### Post-deployment
- [ ] Test all authentication flows
- [ ] Verify error messages display correctly
- [ ] Check browser console for errors
- [ ] Test Google OAuth in production
- [ ] Verify CSP compliance
- [ ] Test rate limiting
- [ ] Monitor error logs

## Troubleshooting

### Common Issues

1. **Google OAuth not working**
   - Check Google Client ID configuration
   - Verify redirect URIs in Google Console
   - Check CSP policy for Google domains

2. **CAPTCHA not working**
   - Check CAPTCHA credentials
   - Verify domain configuration
   - Check CSP policy for CAPTCHA domains

3. **Email verification not working**
   - Check email service configuration
   - Verify SMTP settings
   - Check email templates

4. **Rate limiting too aggressive**
   - Adjust rate limit settings
   - Check Redis connection
   - Monitor rate limit logs

5. **CSP violations**
   - Check browser console for violations
   - Update CSP policy as needed
   - Test with CSP-Report-Only first

## Success Criteria

- [ ] All authentication flows work correctly
- [ ] Error messages are clear and helpful
- [ ] Bilingual support works properly
- [ ] Security measures are effective
- [ ] Performance is acceptable
- [ ] No CSP violations
- [ ] No mixed content warnings
- [ ] Google OAuth works reliably
- [ ] Rate limiting prevents abuse
- [ ] CAPTCHA integration works
