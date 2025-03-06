"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

export default function TestPaymentPage() {
  const { toast } = useToast()
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [paymentLink, setPaymentLink] = useState("")
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [amount, setAmount] = useState("1000")

  // Create a test transaction
  const createTestTransaction = async () => {
    setIsCreatingTransaction(true)
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTestTransaction: true,
          amount: parseFloat(amount)
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        toast({
          title: "Error",
          description: data.error || "Failed to create test transaction",
          variant: "destructive",
        })
        return
      }
      
      setTransactionId(data.transaction.id)
      
      toast({
        title: "Success",
        description: `Test transaction created with ID: ${data.transaction.id}`,
      })
      
    } catch (error) {
      console.error("Error creating test transaction:", error)
      toast({
        title: "Error",
        description: "Failed to create test transaction. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTransaction(false)
    }
  }
  
  // Generate a payment link for the transaction
  const generatePaymentLink = async () => {
    if (!transactionId) {
      toast({
        title: "Error",
        description: "Please create or enter a transaction ID first",
        variant: "destructive",
      })
      return
    }
    
    setIsGeneratingLink(true)
    
    try {
      const response = await fetch('/api/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      })
      
      const responseText = await response.text()
      console.log("Payment link API response:", responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (error) {
        console.error("Failed to parse API response:", error)
        toast({
          title: "Error",
          description: "Invalid response from server",
          variant: "destructive",
        })
        return
      }
      
      if (!response.ok || !data.success) {
        toast({
          title: "Error",
          description: data.error || "Failed to generate payment link",
          variant: "destructive",
        })
        return
      }
      
      setPaymentLink(data.paymentLink)
      setShowLinkDialog(true)
      
      toast({
        title: "Success",
        description: "Payment link generated successfully",
      })
      
    } catch (error) {
      console.error("Error generating payment link:", error)
      toast({
        title: "Error",
        description: "Failed to generate payment link. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLink(false)
    }
  }
  
  // Copy payment link to clipboard
  const copyPaymentLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink)
      toast({
        title: "Copied!",
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
  
  // Use fallback transaction ID
  const useFallbackId = () => {
    setTransactionId("77e80e66-01d6-4d45-b566-11438b2684b8")
    toast({
      title: "Fallback ID Set",
      description: "Using the fallback transaction ID for testing",
    })
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Payment Link Test Utility</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Test Transaction</CardTitle>
          <CardDescription>
            Create a test transaction to use for payment link generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label htmlFor="amount">Amount (in ₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={createTestTransaction} 
                  disabled={isCreatingTransaction}
                  className="w-full"
                >
                  {isCreatingTransaction ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Payment Link</CardTitle>
          <CardDescription>
            Generate a payment link for a transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={generatePaymentLink} 
                  disabled={isGeneratingLink || !transactionId}
                  className="w-full"
                >
                  {isGeneratingLink ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4">
          <Button variant="outline" onClick={useFallbackId} className="mr-2">
            Use Fallback ID
          </Button>
          <p className="text-sm text-muted-foreground">
            Click to use the fallback transaction ID for testing
          </p>
        </CardFooter>
      </Card>
      
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Link Generated</DialogTitle>
            <DialogDescription>
              Use this payment link to complete the test payment
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
                window.open(paymentLink, '_blank');
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