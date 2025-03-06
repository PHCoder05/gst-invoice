"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getService, updateService, type Service } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditServicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<Service>>({
    name: "",
    description: "",
    price: 0,
    active: true,
    hsn_code: "",
    gst_rate: 0,
  })

  useEffect(() => {
    async function loadService() {
      try {
        setIsLoading(true)
        const service = await getService(params.id)
        
        if (!service) {
          toast({
            title: "Error",
            description: "Item not found",
            variant: "destructive",
          })
          router.push("/services")
          return
        }

        const typedService = service as Service

        setFormData({
          name: typedService.name,
          description: typedService.description,
          price: typedService.price,
          active: typedService.active,
          hsn_code: typedService.hsn_code || "",
          gst_rate: typedService.gst_rate || 0,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load item",
          variant: "destructive",
        })
        router.push("/services")
      } finally {
        setIsLoading(false)
      }
    }

    loadService()
  }, [params.id, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)

      // Validate form
      if (!formData.name || !formData.price || !formData.hsn_code || !formData.gst_rate) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive",
        })
        return
      }

      // Update service
      await updateService(params.id, {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        active: formData.active,
        hsn_code: formData.hsn_code,
        gst_rate: Number(formData.gst_rate),
      })

      toast({
        title: "Success",
        description: "Item updated successfully",
      })

      router.push("/services")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Edit Item</h1>

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>Update product or service information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter item description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hsn_code">HSN/SAC Code *</Label>
              <Input
                id="hsn_code"
                name="hsn_code"
                value={formData.hsn_code}
                onChange={handleChange}
                placeholder="Enter HSN/SAC code"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst_rate">GST Rate (%) *</Label>
                <Input
                  id="gst_rate"
                  name="gst_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.gst_rate}
                  onChange={handleChange}
                  placeholder="18"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="active" 
                checked={formData.active} 
                onCheckedChange={handleSwitchChange} 
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/services")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Item"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

