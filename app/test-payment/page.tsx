"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestPaymentPage() {
  const [amount, setAmount] = useState("1000")
  const [customerName, setCustomerName] = useState("Test Customer")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      // Generate a simple random ID
      const randomId = Math.random().toString(36).substring(2, 15)
      
      // Make a direct fetch request to the API
      const response = await fetch('/api/payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: randomId,
          amount: parseFloat(amount),
          customerName: customerName,
          customerPhone: "+919876543210", // Valid phone number
          customerEmail: "test@example.com",
          description: "Test payment"
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link')
      }
      
      setResult(data)
    } catch (err) {
      console.error("Error creating payment:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Test Payment Link</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create a Test Payment Link</CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Payment Link"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-red-50 p-4 rounded text-red-800 whitespace-pre-wrap">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}
      
      {result && (
        <Card className="mb-6 border-green-500">
          <CardHeader>
            <CardTitle className="text-green-500">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label className="font-bold">Payment Link:</Label>
              <div className="mt-1">
                <a 
                  href={result.paymentLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  {result.paymentLink}
                </a>
              </div>
            </div>
            
            <Label className="font-bold">Full Response:</Label>
            <pre className="bg-gray-50 p-4 rounded mt-1 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 