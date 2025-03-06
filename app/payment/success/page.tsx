"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ArrowLeft } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const invoiceId = searchParams.get('invoice_id')
  const razorpay_payment_id = searchParams.get('razorpay_payment_id')
  
  useEffect(() => {
    async function fetchInvoiceData() {
      if (!invoiceId) {
        setError("No invoice ID found in URL")
        setLoading(false)
        return
      }
      
      try {
        // Fetch transaction details from Supabase
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', invoiceId)
          .single()
        
        if (error) {
          console.error("Error fetching invoice:", error)
          setError("Couldn't find transaction details. Please contact support.")
          setLoading(false)
          return
        }
        
        setInvoiceData(data)
        
        // If we have a payment ID from Razorpay, update the transaction status
        if (razorpay_payment_id) {
          await supabase
            .from('transactions')
            .update({ 
              payment_status: 'paid',
              payment_id: razorpay_payment_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', invoiceId)
        }
        
      } catch (error) {
        console.error("Error in payment success page:", error)
        setError("An error occurred. Please contact support.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchInvoiceData()
  }, [invoiceId, razorpay_payment_id])
  
  const handleGoToInvoice = () => {
    router.push(`/transactions/${invoiceId}/invoice`)
  }
  
  const handleGoHome = () => {
    router.push('/')
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-xl">Loading payment information...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">Error</CardTitle>
            <CardDescription>There was a problem processing your payment</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGoHome}>Go to Home</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-20">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          <CardDescription>Your payment has been processed successfully</CardDescription>
        </CardHeader>
        
        <CardContent>
          {invoiceData && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-medium">{invoiceData.invoice_number}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium">₹{invoiceData.total_amount?.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium text-green-600">Paid</span>
              </div>
              
              {razorpay_payment_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID:</span>
                  <span className="font-medium">{razorpay_payment_id}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleGoHome}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
          <Button onClick={handleGoToInvoice}>
            View Invoice
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 