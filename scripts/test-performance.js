const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');

// Test URLs to check
const TEST_URLS = [
  { name: 'Homepage', url: 'http://localhost:3000' },
  { name: 'Products Page', url: 'http://localhost:3000/products' },
  { name: 'Admin Dashboard', url: 'http://localhost:3000/admin' },
  { name: 'User Dashboard', url: 'http://localhost:3000/dashboard' },
];

// Performance thresholds
const THRESHOLDS = {
  'first-contentful-paint': { good: 1800, poor: 3000 },
  'largest-contentful-paint': { good: 2500, poor: 4000 },
  'interactive': { good: 3800, poor: 7300 },
  'cumulative-layout-shift': { good: 0.1, poor: 0.25 },
  'total-blocking-time': { good: 200, poor: 600 },
};

async function runLighthouse(url, options = {}) {
  const chrome = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  options.port = (new URL(chrome.wsEndpoint())).port;
  
  const runnerResult = await lighthouse(url, {
    ...options,
    output: 'json',
    onlyCategories: ['performance'],
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
    },
  });
  
  await chrome.close();
  return runnerResult.lhr;
}

async function formatMetric(metric, value) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return { value, rating: '⚪' };
  
  let rating = '🟢'; // Good
  if (metric === 'cumulative-layout-shift') {
    if (value > threshold.poor) rating = '🔴'; // Poor
    else if (value > threshold.good) rating = '🟡'; // Needs improvement
  } else {
    if (value > threshold.poor) rating = '🔴';
    else if (value > threshold.good) rating = '🟡';
  }
  
  return { value, rating };
}

async function testPerformance() {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 PERFORMANCE TESTING SUITE 🚀      ║
╚════════════════════════════════════════╝
  `);
  
  const results = [];
  
  for (const testUrl of TEST_URLS) {
    console.log(`\n📊 Testing: ${testUrl.name}`);
    console.log(`   URL: ${testUrl.url}`);
    console.log('   Running Lighthouse audit...\n');
    
    try {
      const result = await runLighthouse(testUrl.url);
      const metrics = result.audits;
      
      const pageResult = {
        name: testUrl.name,
        url: testUrl.url,
        score: Math.round(result.categories.performance.score * 100),
        metrics: {
          FCP: await formatMetric('first-contentful-paint', metrics['first-contentful-paint'].numericValue),
          LCP: await formatMetric('largest-contentful-paint', metrics['largest-contentful-paint'].numericValue),
          TTI: await formatMetric('interactive', metrics['interactive'].numericValue),
          CLS: await formatMetric('cumulative-layout-shift', metrics['cumulative-layout-shift'].numericValue),
          TBT: await formatMetric('total-blocking-time', metrics['total-blocking-time'].numericValue),
        },
      };
      
      results.push(pageResult);
      
      console.log(`   Performance Score: ${pageResult.score}/100 ${
        pageResult.score >= 90 ? '🟢' : pageResult.score >= 50 ? '🟡' : '🔴'
      }`);
      console.log(`   
   ┌─────────────────────────────────────┐
   │ Core Web Vitals:                    │
   ├─────────────────────────────────────┤
   │ FCP: ${Math.round(pageResult.metrics.FCP.value)}ms ${pageResult.metrics.FCP.rating}
   │ LCP: ${Math.round(pageResult.metrics.LCP.value)}ms ${pageResult.metrics.LCP.rating}
   │ TTI: ${Math.round(pageResult.metrics.TTI.value)}ms ${pageResult.metrics.TTI.rating}
   │ CLS: ${pageResult.metrics.CLS.value.toFixed(3)} ${pageResult.metrics.CLS.rating}
   │ TBT: ${Math.round(pageResult.metrics.TBT.value)}ms ${pageResult.metrics.TBT.rating}
   └─────────────────────────────────────┘
      `);
      
    } catch (error) {
      console.error(`   ❌ Error testing ${testUrl.name}:`, error.message);
      results.push({
        name: testUrl.name,
        url: testUrl.url,
        error: error.message,
      });
    }
  }
  
  // Generate summary report
  console.log(`
╔════════════════════════════════════════╗
║         📈 SUMMARY REPORT 📈           ║
╚════════════════════════════════════════╝
  `);
  
  const timestamp = new Date().toISOString();
  const reportPath = path.join(__dirname, '..', 'performance-report.json');
  
  const report = {
    timestamp,
    results,
    summary: {
      averageScore: Math.round(
        results.filter(r => !r.error).reduce((sum, r) => sum + r.score, 0) / 
        results.filter(r => !r.error).length
      ),
      passedPages: results.filter(r => !r.error && r.score >= 90).length,
      totalPages: results.length,
    },
  };
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`
  Average Performance Score: ${report.summary.averageScore}/100
  Pages Passed (90+): ${report.summary.passedPages}/${report.summary.totalPages}
  
  Full report saved to: ${reportPath}
  `);
  
  // Provide recommendations
  console.log(`
╔════════════════════════════════════════╗
║       💡 RECOMMENDATIONS 💡            ║
╚════════════════════════════════════════╝
  `);
  
  for (const result of results) {
    if (result.error) continue;
    
    const issues = [];
    if (result.metrics.FCP.rating === '🔴') issues.push('Optimize First Contentful Paint');
    if (result.metrics.LCP.rating === '🔴') issues.push('Improve Largest Contentful Paint');
    if (result.metrics.TTI.rating === '🔴') issues.push('Reduce Time to Interactive');
    if (result.metrics.CLS.rating === '🔴') issues.push('Fix Cumulative Layout Shift');
    if (result.metrics.TBT.rating === '🔴') issues.push('Minimize Total Blocking Time');
    
    if (issues.length > 0) {
      console.log(`\n  ${result.name}:`);
      issues.forEach(issue => console.log(`    • ${issue}`));
    }
  }
}

// Check if lighthouse is installed
try {
  require.resolve('lighthouse');
  require.resolve('puppeteer');
} catch (e) {
  console.error(`
  ❌ Missing dependencies. Please install:
     npm install --save-dev lighthouse puppeteer
  `);
  process.exit(1);
}

// Run the tests
testPerformance()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
