/**
 * Testing utilities for country-based task blocking
 * Only available in development mode
 */

import { NextRequest } from 'next/server'

/**
 * Simulate a request from a specific country for testing
 * This modifies the request headers to simulate geolocation
 */
export function simulateCountryRequest(request: NextRequest, countryCode: string): NextRequest {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Country simulation only available in development mode')
  }

  // Create a new request with simulated country headers
  const headers = new Headers(request.headers)
  headers.set('x-test-country', countryCode.toUpperCase())
  headers.set('cf-ipcountry', countryCode.toUpperCase())
  headers.set('x-vercel-ip-country', countryCode.toUpperCase())

  return new NextRequest(request.url, {
    method: request.method,
    headers,
    body: request.body
  })
}

/**
 * Test country blocking for different scenarios
 */
export const testScenarios = [
  {
    name: 'India (Blocked)',
    country: 'IN',
    expectedBlocked: true,
    description: 'Should be blocked due to regional restrictions'
  },
  {
    name: 'Pakistan (Blocked)',
    country: 'PK',
    expectedBlocked: true,
    description: 'Should be blocked due to regional restrictions'
  },
  {
    name: 'Bangladesh (Blocked)',
    country: 'BD',
    expectedBlocked: true,
    description: 'Should be blocked due to regional restrictions'
  },
  {
    name: 'United States (Allowed)',
    country: 'US',
    expectedBlocked: false,
    description: 'Should be allowed to access tasks'
  },
  {
    name: 'United Kingdom (Allowed)',
    country: 'GB',
    expectedBlocked: false,
    description: 'Should be allowed to access tasks'
  },
  {
    name: 'Canada (Allowed)',
    country: 'CA',
    expectedBlocked: false,
    description: 'Should be allowed to access tasks'
  },
  {
    name: 'Unknown Country',
    country: 'XX',
    expectedBlocked: false,
    description: 'Unknown countries should be allowed by default'
  }
]

/**
 * Run automated tests for country blocking
 */
export async function runCountryBlockingTests(): Promise<{
  passed: number
  failed: number
  results: Array<{
    scenario: string
    country: string
    expected: boolean
    actual: boolean
    passed: boolean
    error?: string
  }>
}> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Country blocking tests only available in development mode')
  }

  const results = []
  let passed = 0
  let failed = 0

  for (const scenario of testScenarios) {
    try {
      const response = await fetch('/api/admin/test-country-blocking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: scenario.country })
      })

      const data = await response.json()
      const actual = data.isBlocked
      const testPassed = actual === scenario.expectedBlocked

      results.push({
        scenario: scenario.name,
        country: scenario.country,
        expected: scenario.expectedBlocked,
        actual,
        passed: testPassed
      })

      if (testPassed) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      results.push({
        scenario: scenario.name,
        country: scenario.country,
        expected: scenario.expectedBlocked,
        actual: false,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      failed++
    }
  }

  return { passed, failed, results }
}

/**
 * Console logging helper for test results
 */
export function logTestResults(results: Awaited<ReturnType<typeof runCountryBlockingTests>>) {
  console.log('\n🧪 Country Blocking Test Results')
  console.log('================================')
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📊 Total: ${results.passed + results.failed}`)
  console.log('\nDetailed Results:')
  
  results.results.forEach(result => {
    const status = result.passed ? '✅' : '❌'
    const error = result.error ? ` (Error: ${result.error})` : ''
    console.log(`${status} ${result.scenario} (${result.country}): Expected ${result.expected}, Got ${result.actual}${error}`)
  })
  
  console.log('\n')
}

/**
 * Development helper to quickly test a specific country
 */
export async function testCountry(countryCode: string): Promise<{
  country: string
  isBlocked: boolean
  message: string
}> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Country testing only available in development mode')
  }

  try {
    const response = await fetch('/api/admin/test-country-blocking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryCode.toUpperCase() })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    throw new Error(`Failed to test country ${countryCode}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
