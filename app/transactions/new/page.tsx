"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash, Plus, Calculator } from "lucide-react"
import {
  getServices,
  createTransaction,
  generateInvoiceNumber,
  type Service,
  type TransactionItem,
} from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function NewTransactionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedItems, setSelectedItems] = useState<TransactionItem[]>([])
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    gstin: "",
    address: "",
  })

  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<string>("0")

  // Calculate totals
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount =
    discountType === "percentage"
      ? (subtotal * Number.parseFloat(discountValue || "0")) / 100
      : Number.parseFloat(discountValue || "0")
  const taxableAmount = subtotal - discountAmount

  // Calculate GST amounts
  const gstAmounts = selectedItems.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity
    const itemDiscount =
      discountType === "percentage"
        ? (itemTotal * Number.parseFloat(discountValue || "0")) / 100
        : (itemTotal / subtotal) * Number.parseFloat(discountValue || "0")

    const itemTaxableAmount = itemTotal - itemDiscount
    const gstAmount = (itemTaxableAmount * item.gst_rate) / 100

    return acc + gstAmount
  }, 0)

  const cgstAmount = gstAmounts / 2
  const sgstAmount = gstAmounts / 2
  const totalAmount = taxableAmount + cgstAmount + sgstAmount

  useEffect(() => {
    async function loadServices() {
      try {
        setIsLoading(true)
        const data = await getServices()
        setServices(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load services",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [toast])

  const handleAddItem = () => {
    if (services.length === 0) return

    const firstService = services[0]
    const newItem: TransactionItem = {
      service_id: firstService.id,
      service_name: firstService.name,
      service_description: firstService.description,
      hsn_code: firstService.hsn_code,
      price: firstService.price,
      gst_rate: firstService.gst_rate,
      quantity: 1,
    }

    setSelectedItems([...selectedItems, newItem])
  }

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, serviceId: string) => {
    const service = services.find((s) => s.id === serviceId)
    if (!service) return

    const updatedItems = [...selectedItems]
    updatedItems[index] = {
      ...updatedItems[index],
      service_id: service.id,
      service_name: service.name,
      service_description: service.description,
      hsn_code: service.hsn_code,
      price: service.price,
      gst_rate: service.gst_rate,
    }

    setSelectedItems(updatedItems)
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...selectedItems]
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
    }

    setSelectedItems(updatedItems)
  }

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCustomerInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)

      // Validate form
      if (!customerInfo.name || !customerInfo.email || selectedItems.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields and add at least one service",
          variant: "destructive",
        })
        return
      }

      // Create transaction
      const transaction = await createTransaction({
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_gstin: customerInfo.gstin,
        customer_address: customerInfo.address,
        invoice_number: generateInvoiceNumber(),
        invoice_date: new Date().toISOString(),
        subtotal,
        discount_type: discountType,
        discount_value: Number.parseFloat(discountValue || "0"),
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        total_amount: totalAmount,
        payment_status: "pending",
        items: selectedItems,
      })

      if (!transaction) {
        toast({
          title: "Error",
          description: "Failed to create transaction",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Transaction created successfully",
      })

      if (transaction && transaction.id) {
        router.push(`/transactions/${transaction.id}/invoice`)
      } else {
        toast({
          title: "Error",
          description: "Transaction was created but has an invalid ID",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create transaction",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Create New Transaction</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>Select services for this transaction</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading services...</div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>HSN Code</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>GST</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center">
                                No services added. Click "Add Service" to begin.
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Select
                                    value={item.service_id}
                                    onValueChange={(value) => handleItemChange(index, value)}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue placeholder="Select service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {services.map((service) => (
                                        <SelectItem key={service.id} value={service.id}>
                                          {service.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>{item.hsn_code}</TableCell>
                                <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                <TableCell>{item.gst_rate}%</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(index, Number.parseInt(e.target.value) || 1)}
                                    className="w-16"
                                  />
                                </TableCell>
                                <TableCell>₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveItem(index)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={handleAddItem}
                      disabled={services.length === 0}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Enter customer details for the invoice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleCustomerChange}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={handleCustomerChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN (Optional)</Label>
                  <Input
                    id="gstin"
                    name="gstin"
                    value={customerInfo.gstin}
                    onChange={handleCustomerChange}
                    placeholder="Enter GSTIN"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleCustomerChange}
                    placeholder="Enter customer address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
                <CardDescription>Review transaction details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select
                    value={discountType}
                    onValueChange={(value: "percentage" | "fixed") => setDiscountType(value)}
                  >
                    <SelectTrigger id="discount-type">
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-value">
                    {discountType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                  </Label>
                  <Input
                    id="discount-value"
                    type="number"
                    min="0"
                    step={discountType === "percentage" ? "1" : "0.01"}
                    max={discountType === "percentage" ? "100" : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Amount:</span>
                    <span>₹{taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting || selectedItems.length === 0}>
                  {isSubmitting ? "Creating..." : "Create Transaction & Generate Invoice"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">GST is calculated after applying the discount</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

