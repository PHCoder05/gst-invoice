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
    
    if (!formData.amount || !formData.customerName) {
      toast({
        title: "Validation Error",
        description: "Please enter amount and customer name",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Generate a random ID for this payment
      const randomId = crypto.randomUUID()
      
      const result = await createPaymentLink({
        amount: parseFloat(formData.amount),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        invoiceId: randomId,
        description: formData.description || `Payment - ₹${parseFloat(formData.amount).toFixed(2)}`
      })
      
      setPaymentLink(result.paymentLink)
      setShowLinkDialog(true)
      
      toast({
        title: "Success",
        description: "Payment link generated successfully",
      })
    } catch (error) {
      console.error("Error creating payment link:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create payment link",
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