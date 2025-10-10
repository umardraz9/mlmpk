# Quick Website Loading Optimization Guide

## 🚀 Immediate Actions (< 5 minutes)

### 1. Test Current Performance
```bash
npm run build
npm run analyze:bundle
```

### 2. Monitor Performance
Add to any page component:
```tsx
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

export default function YourPage() {
  usePerformanceMonitor('YourPageName');
  // ... rest of your component
}
```

### 3. Optimize Images
Replace `<img>` tags with:
```tsx
import { OptimizedImage } from '@/components/OptimizedImage';

<OptimizedImage
  src="/your-image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false} // Only true for hero images
/>
```

## ⚡ Quick Wins

### Lazy Load Heavy Components
```tsx
import { lazyLoadComponent } from '@/components/optimization/LazyLoader';

const HeavyChart = lazyLoadComponent(
  () => import('./HeavyChartComponent')
);
```

### Optimize Framer Motion
```tsx
import { LazyMotionWrapper, MotionDiv, fadeInUp } from '@/components/optimization/LazyMotion';

<LazyMotionWrapper>
  <MotionDiv {...fadeInUp}>
    Your animated content
  </MotionDiv>
</LazyMotionWrapper>
```

### Add Resource Hints
Add to layout or specific pages:
```tsx
import { ResourceHints } from '@/components/optimization/ResourceHints';

<ResourceHints routes={['/dashboard', '/products']} />
```

## 📊 Performance Monitoring

### Development
```bash
# Start dev server with monitoring
npm run dev

# Check browser console for performance metrics
```

### Production Analysis
```bash
# Build and analyze
npm run perf:all

# Run Lighthouse audit
npm run perf:lighthouse
```

## 🎯 Key Metrics to Watch

| Metric | Target | Current |
|--------|--------|---------|
| **FCP** (First Contentful Paint) | < 1.5s | Check in DevTools |
| **LCP** (Largest Contentful Paint) | < 2.5s | Check in DevTools |
| **TTI** (Time to Interactive) | < 3.5s | Check in DevTools |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Check in DevTools |
| **Bundle Size** | < 300KB | Run `npm run analyze:bundle` |

## 🛠️ Common Optimizations

### 1. Reduce Bundle Size
- ✅ Use dynamic imports for code splitting
- ✅ Remove unused dependencies
- ✅ Enable tree-shaking
- ✅ Use `npm run analyze:bundle` to find large packages

### 2. Optimize Images
- ✅ Use WebP/AVIF formats
- ✅ Add width & height to prevent layout shift
- ✅ Lazy load images below the fold
- ✅ Use `next/image` or `OptimizedImage` component

### 3. Reduce JavaScript
- ✅ Lazy load heavy components
- ✅ Use `React.memo` for expensive renders
- ✅ Debounce expensive operations
- ✅ Remove console.logs in production (automatic)

### 4. Improve Caching
- ✅ Already configured in `next.config.js`
- ✅ Static assets cached for 1 year
- ✅ API responses use stale-while-revalidate
- ✅ Fonts preloaded and cached

## 🔧 Tools & Commands

```bash
# Performance Suite
npm run perf:all              # Build + Analyze + Apply DB indexes

# Individual Commands
npm run build                 # Production build
npm run analyze:bundle        # Analyze bundle size
npm run perf:indexes          # Apply database indexes
npm run perf:lighthouse       # Run Lighthouse audit

# Development
npm run dev                   # Start dev server with hot reload
```

## 📈 Monitoring in Production

The app automatically tracks:
- ✅ Core Web Vitals (FCP, LCP, CLS, TTI)
- ✅ Page load times
- ✅ Network quality detection
- ✅ Performance marks and measures

Check browser console in development for real-time metrics.

## 🐛 Quick Fixes

### Slow Page Load?
1. Check `npm run analyze:bundle` for large chunks
2. Lazy load non-critical components
3. Verify images are optimized
4. Check network tab in DevTools

### Layout Shift (CLS) Issues?
1. Add width/height to all images
2. Reserve space for dynamic content
3. Use CSS aspect-ratio
4. Avoid inserting content above existing content

### Large Bundle Size?
1. Run `npm run analyze:bundle`
2. Use dynamic imports: `const Component = dynamic(() => import('./Component'))`
3. Remove unused dependencies
4. Check for duplicate packages

## 📚 Optimization Files Created

- `/src/components/optimization/LazyLoader.tsx` - Component lazy loading
- `/src/components/optimization/LazyMotion.tsx` - Framer Motion optimization
- `/src/components/optimization/ResourceHints.tsx` - Resource preloading
- `/src/lib/performance-utils.ts` - Performance utilities
- `/src/hooks/usePerformanceMonitor.ts` - Performance monitoring hook
- `/scripts/analyze-bundle.js` - Bundle size analyzer

## ✅ Checklist Before Deploy

- [ ] Run `npm run build` successfully
- [ ] Bundle size < 300KB (check with `npm run analyze:bundle`)
- [ ] Lighthouse score > 90 (run `npm run perf:lighthouse`)
- [ ] All images optimized with proper dimensions
- [ ] Heavy components lazy loaded
- [ ] Performance monitoring enabled
- [ ] Test on slow 3G network
- [ ] Verify mobile performance

## 🎓 Best Practices

1. **Always** use `next/image` for images
2. **Always** specify image dimensions
3. **Lazy load** components below the fold
4. **Monitor** performance with dev tools
5. **Test** on slow networks
6. **Measure** before and after optimizations
7. **Review** bundle size regularly

---

**Need Help?** Check `PERFORMANCE_OPTIMIZATION.md` for detailed documentation.
