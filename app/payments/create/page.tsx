"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { createPaymentLink } from "@/lib/razorpay"

export default function CreatePaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    amount: "1000",
    customerName: "",
    customerEmail: "",
    customerPhone: "+91",
    description: "Invoice payment",
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [paymentLink, setPaymentLink] = useState("")
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted with data:", formData)
    
    if (!formData.amount || !formData.customerName) {
      toast({
        title: "Validation Error",
        description: "Please enter amount and customer name",
        variant: "destructive",
      })
      return
    }
    
    // Validate phone number - ensure it's at least 8 characters
    if (formData.customerPhone && formData.customerPhone.length < 8) {
      console.log("Phone number too short:", formData.customerPhone);
      // Add more digits to make it valid
      formData.customerPhone = formData.customerPhone + "12345678".substring(0, 8 - formData.customerPhone.length);
      console.log("Adjusted phone number:", formData.customerPhone);
      
      toast({
        title: "Phone Number Adjusted",
        description: "Your phone number was too short and has been adjusted to meet requirements.",
      })
    }
    
    setIsLoading(true)
    
    try {
      // Generate a random ID for this payment
      let randomId;
      try {
        randomId = crypto.randomUUID();
      } catch (cryptoError) {
        console.error("Error generating UUID:", cryptoError);
        // Fallback to a simple random ID if crypto.randomUUID() is not available
        randomId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      }
      
      console.log("Generated transaction ID:", randomId);
      
      // Ensure amount is a number and not an empty string
      const numericAmount = parseFloat(formData.amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error("Invalid amount. Please enter a valid number greater than 0.");
      }
      
      const paymentData = {
        amount: numericAmount,
        customerName: formData.customerName.trim(), // Trim whitespace
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        invoiceId: randomId,
        description: formData.description || `Payment - ₹${numericAmount.toFixed(2)}`
      };
      
      console.log("Sending payment data:", paymentData);
      
      // First, test if the API endpoint is accessible
      try {
        const testResponse = await fetch('/api/test-razorpay');
        const testData = await testResponse.json();
        console.log("API test response:", testData);
        
        if (!testData.credentials.key_id_exists || !testData.credentials.key_secret_exists) {
          throw new Error("Razorpay credentials are missing. Please check your environment variables.");
        }
      } catch (testError) {
        console.error("Error testing API:", testError);
        throw new Error("Could not connect to the API to verify credentials: " + 
                        (testError instanceof Error ? testError.message : String(testError)));
      }
      
      // Now try to create the payment link
      const result = await createPaymentLink(paymentData);
      
      console.log("Payment link created:", result);
      
      setPaymentLink(result.paymentLink)
      setShowLinkDialog(true)
      
      toast({
        title: "Success",
        description: "Payment link generated successfully",
      })
    } catch (error) {
      console.error("Error creating payment link:", error)
      
      // More detailed error message
      let errorMessage = "Failed to create payment link";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error stack:", error.stack);
      } else {
        errorMessage = String(error);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const copyPaymentLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink)
      toast({
        title: "Link Copied!",
        description: "Payment link copied to clipboard",
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create Payment Link</h1>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Create a shareable payment link for your customer
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email (Optional)</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleInputChange}
                placeholder="Enter customer email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone (Optional)</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                placeholder="Enter customer phone with country code"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter payment description"
                rows={3}
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Payment Link"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Link Generated</DialogTitle>
            <DialogDescription>
              Share this payment link with your customer
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="paymentLink" className="sr-only">
                Payment Link
              </Label>
              <Input
                id="paymentLink"
                value={paymentLink}
                readOnly
                className="w-full"
              />
            </div>
            <Button onClick={copyPaymentLink} type="button" size="sm" className="px-3">
              <span className="sr-only">Copy</span>
              Copy
            </Button>
          </div>
          
          <DialogFooter className="sm:justify-start mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowLinkDialog(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.open(paymentLink, '_blank')
              }}
            >
              Open Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 