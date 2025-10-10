# MCNmart Performance Optimization Guide

## 🚀 Overview

This document outlines all performance optimizations implemented in the MCNmart application to ensure fast loading times and excellent user experience.

## 📊 Key Performance Metrics

### Target Goals
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Bundle Size**: < 300KB (gzipped)

## 🛠️ Implemented Optimizations

### 1. Font Loading Optimization

**Location**: `src/app/layout.tsx`

**Improvements**:
- Using `font-display: swap` for immediate text rendering
- Preloading critical fonts with `preload: true`
- System font fallbacks to prevent layout shifts
- Font fallback adjustment for consistent sizing

```typescript
const inter = Inter({ 
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
})
```

### 2. Image Optimization

**Location**: `src/components/OptimizedImage.tsx`

**Features**:
- Lazy loading with Intersection Observer
- WebP format support with AVIF fallback
- Responsive image sizing
- Blur placeholder for smooth loading
- Error handling with fallback images

**Usage**:
```tsx
import { OptimizedImage } from '@/components/OptimizedImage';

<OptimizedImage
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false} // Only true for above-the-fold images
/>
```

### 3. Component Lazy Loading

**Location**: `src/components/optimization/LazyLoader.tsx`

**Features**:
- Automatic code splitting
- Loading skeletons
- Intersection Observer for viewport-based loading

**Usage**:
```tsx
import { lazyLoadComponent } from '@/components/optimization/LazyLoader';

const HeavyComponent = lazyLoadComponent(
  () => import('./HeavyComponent'),
  <LoadingSkeleton />
);
```

### 4. Framer Motion Optimization

**Location**: `src/components/optimization/LazyMotion.tsx`

**Benefits**:
- Reduces initial bundle size by ~30KB
- Only loads motion features when needed
- Provides optimized animation presets

**Usage**:
```tsx
import { LazyMotionWrapper, MotionDiv, fadeInUp } from '@/components/optimization/LazyMotion';

<LazyMotionWrapper>
  <MotionDiv {...fadeInUp}>
    Animated content
  </MotionDiv>
</LazyMotionWrapper>
```

### 5. Next.js Configuration

**Location**: `next.config.js`

**Key Settings**:
- **Compression**: Enabled for all responses
- **SWC Minification**: Fast, modern JavaScript minification
- **Console removal**: Removes console.log in production
- **Module optimization**: Tree-shaking for lucide-react, radix-ui, framer-motion
- **Image optimization**: AVIF and WebP formats
- **Caching headers**: Aggressive caching for static assets

### 6. API Caching Strategy

**Headers Configuration**:
- Static assets: 1 year cache (`max-age=31536000`)
- API routes: 60s cache with 5min stale-while-revalidate
- HTML pages: 10s cache with 1min stale-while-revalidate

### 7. Database Optimization

**Location**: `scripts/apply-performance-indexes.js`

**Improvements**:
- Indexed frequently queried columns
- Optimized foreign key relationships
- Query performance monitoring

**Run**: `npm run perf:indexes`

### 8. Performance Monitoring

**Location**: `src/lib/performance-utils.ts`

**Features**:
- Core Web Vitals tracking (FCP, LCP, CLS, TTI)
- Network quality detection
- Route prefetching utilities
- Image optimization helpers

**Usage**:
```tsx
import { getCoreWebVitals, reportWebVitals } from '@/lib/performance-utils';

useEffect(() => {
  getCoreWebVitals().then(reportWebVitals);
}, []);
```

## 🔧 Available Commands

### Build & Analysis
```bash
# Standard build
npm run build

# Build with bundle analysis
npm run analyze:bundle

# Full performance suite
npm run perf:all
```

### Testing
```bash
# Run Lighthouse audit
npm run perf:lighthouse

# Run custom performance tests
npm run perf:test
```

### Database
```bash
# Apply performance indexes
npm run perf:indexes
```

## 📈 Best Practices

### 1. Images
- ✅ Always use `next/image` or `OptimizedImage` component
- ✅ Set `priority={true}` only for above-the-fold images
- ✅ Provide `width` and `height` to prevent layout shifts
- ✅ Use appropriate sizes prop for responsive images
- ❌ Don't use large unoptimized images

### 2. Components
- ✅ Use dynamic imports for heavy components
- ✅ Implement loading skeletons for better UX
- ✅ Memoize expensive calculations with `useMemo`
- ✅ Use `React.memo` for pure components
- ❌ Don't import entire libraries when you need specific functions

### 3. Third-Party Scripts
- ✅ Load non-critical scripts after page load
- ✅ Use `next/script` with `strategy="afterInteractive"`
- ✅ Minimize third-party dependencies
- ❌ Don't block initial page load with external scripts

### 4. Fonts
- ✅ Use Next.js font optimization
- ✅ Specify font-display: swap
- ✅ Preload critical fonts only
- ❌ Don't load multiple font weights unnecessarily

### 5. API Routes
- ✅ Implement caching where appropriate
- ✅ Use pagination for large datasets
- ✅ Minimize payload size
- ❌ Don't fetch unnecessary data

## 🎯 Optimization Checklist

### Before Deploying
- [ ] Run `npm run build` successfully
- [ ] Check `npm run analyze:bundle` for large chunks
- [ ] Verify `npm run perf:lighthouse` scores > 90
- [ ] Test on slow 3G network
- [ ] Verify mobile performance
- [ ] Check image optimization
- [ ] Confirm lazy loading works
- [ ] Test with browser dev tools throttling

### Regular Maintenance
- [ ] Monitor Core Web Vitals monthly
- [ ] Review and remove unused dependencies
- [ ] Update Next.js and dependencies
- [ ] Run performance audits quarterly
- [ ] Analyze user performance metrics
- [ ] Check bundle size trends

## 🐛 Common Issues & Solutions

### Issue: Large Initial Bundle Size
**Solution**: 
- Use dynamic imports for page-specific components
- Check `npm run analyze:bundle` to identify large dependencies
- Consider lazy loading heavy libraries

### Issue: Slow Image Loading
**Solution**:
- Ensure images are optimized and properly sized
- Use `priority={true}` for above-the-fold images
- Consider using blur placeholders
- Check image CDN configuration

### Issue: Poor Mobile Performance
**Solution**:
- Test with Chrome DevTools mobile emulation
- Reduce JavaScript bundle size
- Optimize for slow networks
- Implement progressive enhancement

### Issue: Layout Shift (CLS)
**Solution**:
- Always specify image dimensions
- Reserve space for dynamic content
- Use CSS aspect-ratio for responsive elements
- Avoid inserting content above existing content

## 📚 Additional Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)

## 🔄 Version History

### v1.0.0 (Current)
- Initial performance optimization implementation
- Font loading optimization
- Image optimization system
- Component lazy loading
- Framer Motion optimization
- Bundle analysis tools
- Performance monitoring utilities

---

**Last Updated**: October 2025
**Maintained By**: MCNmart Development Team
