"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Printer, CreditCard, Share2, Link } from "lucide-react"
import { getTransaction, updateTransactionPayment } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPaymentLink } from "@/lib/razorpay"
import { type Transaction } from '@/lib/temp'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [paymentLink, setPaymentLink] = useState("")
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  useEffect(() => {
    // Declare Razorpay type for TypeScript
    if (typeof window !== 'undefined') {
      window.Razorpay = window.Razorpay || {};
    }
    
    loadTransaction()

    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => {
      console.log("Razorpay script loaded successfully")
      setRazorpayLoaded(true)
    }
    script.onerror = (error) => {
      console.error("Failed to load Razorpay script:", error)
    }
    document.body.appendChild(script)

    // Debug: Check if Razorpay key is available
    console.log("Razorpay key in environment:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? "Available" : "Not available")

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const loadTransaction = async () => {
    try {
      setIsLoading(true)
      const data = await getTransaction(params.id)
      if (!data) {
        throw new Error('Transaction not found')
      }
      setTransaction(data)
    } catch (error) {
      console.error('Error loading transaction:', error)
      toast({
        title: "Error",
        description: "Failed to load transaction details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handlePayment = async () => {
    if (!transaction) return

    setIsProcessingPayment(true)
    console.log("Payment process started")

    // Check if Razorpay key is available and script is loaded
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    
    console.log("Razorpay key:", razorpayKeyId)
    console.log("Razorpay script loaded:", razorpayLoaded)
    console.log("Razorpay global object:", typeof window !== 'undefined' ? (window.Razorpay ? "Available" : "Not available") : "Window not defined")
    console.log("Type of Razorpay:", typeof window !== 'undefined' ? typeof window.Razorpay : "undefined")

    // Use mock payment only if Razorpay is not available
    if (!razorpayKeyId || !razorpayLoaded || (typeof window !== 'undefined' && !window.Razorpay)) {
      console.log("Using mock payment mode - Razorpay not available")
      // Simulate a delay for better user experience
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate a mock payment ID
      const mockPaymentId = "pay_mock_" + Math.random().toString(36).substring(2, 10)
      console.log("Generated mock payment ID:", mockPaymentId)
      
      // Update transaction payment status
      await updateTransactionPayment(transaction.id!, mockPaymentId)
      console.log("Transaction payment status updated successfully")

      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully (Test Mode)",
      })

      // Reload transaction to update UI
      loadTransaction()
      setIsProcessingPayment(false)
      return
    }

    try {
      console.log("Creating order via API")
      // Create order via API
      const orderResponse = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id }),
      });
      
      const responseText = await orderResponse.text();
      console.log("Raw API response:", responseText);
      
      let orderData;
      try {
        orderData = JSON.parse(responseText);
        console.log("Parsed order data:", orderData);
      } catch (parseError) {
        console.error("Failed to parse API response:", parseError);
        toast({
          title: "Payment Initialization Failed",
          description: "Invalid response from server. Please try again later.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }
      
      if (!orderResponse.ok) {
        console.error("Order creation failed:", orderResponse.status, orderData);
        
        toast({
          title: "Payment Initialization Failed",
          description: orderData.error || "Could not initialize payment. Please try again later.",
          variant: "destructive",
        });
        
        setIsProcessingPayment(false);
        return;
      }
      
      if (!orderData.success) {
        console.error("Invalid order data received:", orderData);
        
        toast({
          title: "Payment Initialization Failed",
          description: orderData.error || "Invalid order data received. Please try again later.",
          variant: "destructive",
        });
        
        setIsProcessingPayment(false);
        return;
      }
      
      if (!orderData.orderId) {
        console.error("Order ID missing in response:", orderData);
        
        toast({
          title: "Payment Initialization Failed",
          description: "Order ID missing in response. Please try again later.",
          variant: "destructive",
        });
        
        setIsProcessingPayment(false);
        return;
      }
      
      console.log("Order created successfully:", orderData);
      
      // Add a small delay to ensure Razorpay is fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Double check Razorpay is available
      if (typeof window.Razorpay !== 'function') {
        console.error("Razorpay is not available as a function after delay");
        console.log("Type of window.Razorpay:", typeof window.Razorpay);
        
        toast({
          title: "Payment Error",
          description: "Payment gateway not available. Please try again or contact support.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }
      
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount || Math.round(transaction.total_amount * 100), // Amount in paise
        currency: orderData.currency || "INR",
        order_id: orderData.orderId,
        name: "Your Company Name",
        description: `Payment for Invoice ${transaction.invoice_number}`,
        receipt: orderData.receipt,
        notes: orderData.notes || {
          transactionId: transaction.id,
          invoiceNumber: transaction.invoice_number
        },
        handler: async function(response: any) {
          try {
            console.log("Payment successful:", response)
            // Update transaction payment status
            await updateTransactionPayment(transaction.id!, response.razorpay_payment_id)

            toast({
              title: "Payment Successful",
              description: "Your payment has been processed successfully",
            })

            // Reload transaction to update UI
            loadTransaction()
          } catch (error) {
            console.error("Error updating payment status:", error)
            toast({
              title: "Error",
              description: "Payment was successful, but we couldn't update the status. Please contact support.",
              variant: "destructive",
            })
          } finally {
            setIsProcessingPayment(false)
          }
        },
        prefill: {
          name: transaction.customer_name || "",
          email: transaction.customer_email || "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal dismissed");
            setIsProcessingPayment(false)
          }
        }
      };

      console.log("Opening Razorpay with options:", { ...options, key: razorpayKeyId })
      
      try {
        // Create a new instance of Razorpay
        console.log("Creating Razorpay instance");
        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', function(response: any) {
          console.error("Payment failed:", response.error)
          toast({
            title: "Payment Failed",
            description: response.error.description || "Your payment attempt failed. Please try again.",
            variant: "destructive",
          })
          setIsProcessingPayment(false)
        });
        
        console.log("Opening Razorpay payment modal");
        razorpay.open();
        console.log("Razorpay open method called");
      } catch (razorpayError) {
        console.error("Error creating or opening Razorpay instance:", razorpayError);
        toast({
          title: "Payment Gateway Error",
          description: "Could not open payment gateway. Please try again later.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error("Error initializing Razorpay:", error)
      toast({
        title: "Error",
        description: "Failed to initialize payment gateway. Please try again later.",
        variant: "destructive",
      })
      setIsProcessingPayment(false)
    }
  }

  const handleShare = async () => {
    if (!transaction) return;
    
    // Create a shareable link to the share page
    const shareUrl = `${window.location.origin}/transactions/${transaction.id}/share`;
    setShareUrl(shareUrl);
    
    try {
      if (navigator.share) {
        // Use Web Share API if available
        await navigator.share({
          title: `Invoice #${transaction.invoice_number}`,
          text: `Please view and pay your invoice #${transaction.invoice_number} for ${transaction.total_amount.toFixed(2)} INR`,
          url: shareUrl,
        });
        console.log("Shared successfully using Web Share API");
      } else {
        // Show dialog with copy option if Web Share API is not available
        setShowShareDialog(true);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback to dialog on error
      setShowShareDialog(true);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Payment link copied to clipboard. You can now share it with your customer.",
      });
      setShowShareDialog(false);
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Copying Failed",
        description: "Could not copy the payment link",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!transaction || !transaction.id) {
      toast({
        title: "Error",
        description: "Transaction details not found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingLink(true)
      const result = await createPaymentLink({
        amount: transaction.total_amount,
        customerName: transaction.customer_name || 'Customer',
        customerEmail: transaction.customer_email || '',
        invoiceId: transaction.id,
        description: `Invoice #${transaction.invoice_number} - Amount: ₹${transaction.total_amount.toFixed(2)}`
      });
      
      console.log("Payment link generated successfully:", result.paymentLink);
      setPaymentLink(result.paymentLink);
      setShowLinkDialog(true);
      
      toast({
        title: "Success",
        description: "Payment link generated successfully",
      });
    } catch (error) {
      console.error('Error generating payment link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate payment link",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
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
      console.error("Failed to copy link:", error)
      toast({
        title: "Error",
        description: "Failed to copy link. Please try manually.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-10 px-4 text-center">Loading invoice...</div>
  }

  if (!transaction) {
    return <div className="container mx-auto py-10 px-4 text-center">Transaction not found</div>
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold">Invoice</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          {transaction?.payment_status === "pending" && (
            <>
              <Button onClick={handlePayment} disabled={isProcessingPayment}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleGeneratePaymentLink} 
                disabled={isGeneratingLink}
              >
                <Link className="mr-2 h-4 w-4" />
                {isGeneratingLink ? "Generating..." : "Payment Link"}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="p-8 invoice-container">
        <div className="invoice-header">
          <div>
            <h2 className="text-2xl font-bold">INVOICE</h2>
            <p className="text-muted-foreground">Your Company Name</p>
            <p className="text-muted-foreground">Your Address, City, State, ZIP</p>
            <p className="text-muted-foreground">GSTIN: 12ABCDE1234F1Z5</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end mb-2">
              <h3 className="text-xl font-semibold mr-2">Status:</h3>
              <Badge variant={transaction.payment_status === "paid" ? "success" : "outline"}>
                {transaction.payment_status === "paid" ? "Paid" : "Pending"}
              </Badge>
            </div>
            <p>
              <strong>Invoice #:</strong> {transaction.invoice_number}
            </p>
            <p>
              <strong>Date:</strong> {new Date(transaction.invoice_date).toLocaleDateString()}
            </p>
            {transaction.payment_status === "paid" && (
              <p>
                <strong>Payment ID:</strong> {transaction.payment_id}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
            <p>
              <strong>{transaction.customer_name}</strong>
            </p>
            <p>{transaction.customer_email}</p>
            {transaction.customer_gstin && <p>GSTIN: {transaction.customer_gstin}</p>}
            {transaction.customer_address && <p>{transaction.customer_address}</p>}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Services:</h3>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>HSN Code</th>
                <th>Qty</th>
                <th>Price</th>
                <th>GST Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transaction.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div>
                      <p className="font-medium">{item.service_name}</p>
                      <p className="text-sm text-muted-foreground">{item.service_description}</p>
                    </div>
                  </td>
                  <td>{item.hsn_code}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price.toFixed(2)}</td>
                  <td>{item.gst_rate}%</td>
                  <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 invoice-summary">
          <div className="invoice-summary-row">
            <span>Subtotal:</span>
            <span>₹{transaction.subtotal.toFixed(2)}</span>
          </div>
          <div className="invoice-summary-row">
            <span>
              Discount ({transaction.discount_type === "percentage" ? `${transaction.discount_value}%` : "Fixed"}):
            </span>
            <span>₹{transaction.discount_amount.toFixed(2)}</span>
          </div>
          <div className="invoice-summary-row">
            <span>Taxable Amount:</span>
            <span>₹{transaction.taxable_amount.toFixed(2)}</span>
          </div>
          <div className="invoice-summary-row">
            <span>CGST:</span>
            <span>₹{transaction.cgst_amount.toFixed(2)}</span>
          </div>
          <div className="invoice-summary-row">
            <span>SGST:</span>
            <span>₹{transaction.sgst_amount.toFixed(2)}</span>
          </div>
          <div className="invoice-summary-row font-bold text-lg">
            <span>Total:</span>
            <span>₹{transaction.total_amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-12 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Payment Information:</h3>
          <p>Account Name: Your Company Name</p>
          <p>Bank: Your Bank Name</p>
          <p>Account Number: XXXXXXXXXXXX</p>
          <p>IFSC Code: XXXXXXXX</p>
        </div>

        <div className="mt-8 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Terms & Conditions:</h3>
          <ul className="list-disc pl-5 text-sm">
            <li>Payment is due within 15 days of invoice date.</li>
            <li>Please include the invoice number in your payment reference.</li>
            <li>This is a computer-generated invoice and does not require a signature.</li>
          </ul>
        </div>

        <div className="invoice-footer">
          <p>Thank you for your business!</p>
        </div>
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Invoice</DialogTitle>
            <DialogDescription>
              Share this invoice link with your customer to allow them to view and pay.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="shareLink" className="sr-only">
                Share Link
              </Label>
              <Input
                id="shareLink"
                value={shareUrl}
                readOnly
                className="w-full"
              />
            </div>
            <Button onClick={copyShareLink} type="button" size="sm" className="px-3">
              <span className="sr-only">Copy</span>
              Copy
            </Button>
          </div>
          <DialogFooter className="sm:justify-start mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowShareDialog(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.open(shareUrl, '_blank');
              }}
            >
              Open Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Link Generated</DialogTitle>
            <DialogDescription>
              Share this payment link with your customer to allow them to pay for this invoice.
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

