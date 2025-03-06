"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, ArrowLeft } from "lucide-react"
import { getTransaction, type Transaction } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function TransactionDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTransaction() {
      try {
        setIsLoading(true)
        const data = await getTransaction(params.id)
        setTransaction(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load transaction",
          variant: "destructive",
        })
        router.push("/transactions")
      } finally {
        setIsLoading(false)
      }
    }

    loadTransaction()
  }, [params.id, router, toast])

  if (isLoading) {
    return <div className="container mx-auto py-10 px-4 text-center">Loading transaction...</div>
  }

  if (!transaction) {
    return <div className="container mx-auto py-10 px-4 text-center">Transaction not found</div>
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/transactions")} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Transaction Details</h1>
        <div className="ml-auto">
          <Link href={`/transactions/${transaction.id}/invoice`}>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              View Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Services included in this transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>GST Rate</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.service_name}</p>
                        <p className="text-sm text-muted-foreground">{item.service_description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.hsn_code}</TableCell>
                    <TableCell>₹{item.price.toFixed(2)}</TableCell>
                    <TableCell>{item.gst_rate}%</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
              <CardDescription>
                Invoice #{transaction.invoice_number}
                <Badge className="ml-2" variant={transaction.payment_status === "paid" ? "success" : "outline"}>
                  {transaction.payment_status === "paid" ? "Paid" : "Pending"}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(transaction.invoice_date).toLocaleDateString()}</span>
                </div>
                {transaction.payment_status === "paid" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID:</span>
                    <span>{transaction.payment_id}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{transaction.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Discount ({transaction.discount_type === "percentage" ? `${transaction.discount_value}%` : "Fixed"}
                    ):
                  </span>
                  <span>₹{transaction.discount_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Amount:</span>
                  <span>₹{transaction.taxable_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST:</span>
                  <span>₹{transaction.cgst_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST:</span>
                  <span>₹{transaction.sgst_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{transaction.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{transaction.customer_name}</p>
                <p>{transaction.customer_email}</p>
                {transaction.customer_gstin && <p>GSTIN: {transaction.customer_gstin}</p>}
                {transaction.customer_address && <p className="whitespace-pre-line">{transaction.customer_address}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

