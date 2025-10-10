'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, TestTube, AlertTriangle, CheckCircle, Ban } from 'lucide-react'

export default function TestCountryBlockingPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const testCountries = [
    { code: 'IN', name: 'India', shouldBlock: true },
    { code: 'PK', name: 'Pakistan', shouldBlock: true },
    { code: 'BD', name: 'Bangladesh', shouldBlock: true },
    { code: 'US', name: 'United States', shouldBlock: false },
    { code: 'GB', name: 'United Kingdom', shouldBlock: false },
  ]

  const testCountryBlocking = async (countryCode: string, shouldBlock: boolean) => {
    setLoading(true)
    try {
      // Test by adding query parameter to simulate country
      const response = await fetch(`/api/tasks?simulate_country=${countryCode}`)
      const isBlocked = response.status === 403
      const data = await response.json()
      
      return {
        country: countryCode,
        shouldBlock,
        actuallyBlocked: isBlocked,
        passed: isBlocked === shouldBlock,
        response: data,
        status: response.status
      }
    } catch (error) {
      return {
        country: countryCode,
        shouldBlock,
        actuallyBlocked: false,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setTestResults([])
    
    const results = []
    for (const country of testCountries) {
      const result = await testCountryBlocking(country.code, country.shouldBlock)
      results.push({ ...result, name: country.name })
      setTestResults([...results])
    }
    
    setLoading(false)
  }

  const testSingleCountry = async (countryCode: string, name: string, shouldBlock: boolean) => {
    setLoading(true)
    const result = await testCountryBlocking(countryCode, shouldBlock)
    setTestResults(prev => [...prev.filter(r => r.country !== countryCode), { ...result, name }])
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Country Blocking Test Page</h1>
        </div>
        <p className="text-gray-600">
          Test the geographical restrictions for the task system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Quick Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {testCountries.map(country => (
              <Button
                key={country.code}
                variant={country.shouldBlock ? "destructive" : "default"}
                onClick={() => testSingleCountry(country.code, country.name, country.shouldBlock)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {country.shouldBlock ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                Test {country.name} ({country.code})
              </Button>
            ))}
          </div>
          
          <Button 
            onClick={runAllTests} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${result.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <div className="font-medium">
                        {result.name} ({result.country})
                      </div>
                      <div className="text-sm text-gray-600">
                        Expected: {result.shouldBlock ? 'Blocked' : 'Allowed'} | 
                        Actual: {result.actuallyBlocked ? 'Blocked' : 'Allowed'} |
                        Status: {result.status}
                      </div>
                      {result.error && (
                        <div className="text-sm text-red-600">Error: {result.error}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant={result.passed ? "default" : "destructive"}>
                    {result.passed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <strong>Summary:</strong> {testResults.filter(r => r.passed).length} passed, {testResults.filter(r => !r.passed).length} failed
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800 mb-1">How This Works</h3>
              <div className="text-sm text-orange-700 space-y-1">
                <p>• This page tests country blocking by adding <code>?simulate_country=XX</code> to API requests</p>
                <p>• In development, the system uses query parameters to simulate different countries</p>
                <p>• Blocked countries (IN, PK, BD) should return HTTP 403 with REGION_BLOCKED error</p>
                <p>• Allowed countries should return normal task data or other responses</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
