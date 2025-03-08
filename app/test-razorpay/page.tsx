"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestRazorpayPage() {
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testApi = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/test-razorpay')
      const data = await response.json()
      setApiResponse(data)
    } catch (err) {
      console.error("Error testing API:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Test Razorpay Configuration</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Razorpay API Test</CardTitle>
          <CardDescription>
            Test if your Razorpay API keys are configured correctly
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Button 
            onClick={testApi} 
            disabled={loading}
          >
            {loading ? "Testing..." : "Test Razorpay Configuration"}
          </Button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
              <h3 className="font-bold">Error:</h3>
              <p>{error}</p>
            </div>
          )}
          
          {apiResponse && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-bold mb-2">API Response:</h3>
              <pre className="whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <p className="text-sm text-gray-500">
            If the test is successful, you should see your Razorpay key ID prefix and confirmation that the secret key exists.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 