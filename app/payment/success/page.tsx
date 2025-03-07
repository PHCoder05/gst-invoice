"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ArrowLeft } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Loading component for suspense fallback
function PaymentSuccessLoading() {
  return (
    <div className="container mx-auto py-20 text-center">
      <p className="text-xl">Loading payment information...</p>
    </div>
  )
}

// Component that uses useSearchParams must be wrapped in Suspense
function PaymentSuccessContent() {
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
        
        <CardContent className="space-y-4">
          {invoiceData && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Invoice Number:</span>
                <span className="font-medium">{invoiceData.invoice_number}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-medium">₹{invoiceData.total_amount?.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="font-medium break-all">{razorpay_payment_id || invoiceData.payment_id || "N/A"}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={handleGoHome}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Home
          </Button>
          
          <Button 
            className="w-full sm:w-auto"
            onClick={handleGoToInvoice}
          >
            View Invoice
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Main component with suspense boundary
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  )
} 