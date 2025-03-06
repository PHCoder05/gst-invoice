"use client"

import { useEffect } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createService, checkAuth } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"

export default function NewServicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authStatus, setAuthStatus] = useState<string>("Checking...")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    active: true,
    hsn_code: "",
    gst_rate: "18",
  })

  useEffect(() => {
    async function checkAuthentication() {
      const { data, error } = await checkAuth();
      if (error) {
        setAuthStatus("Authentication error");
        toast({
          title: "Authentication Error",
          description: "There was an error authenticating with Supabase",
          variant: "destructive",
        });
      } else if (!data || !data.session) {
        setAuthStatus("Not authenticated");
        toast({
          title: "Authentication Error",
          description: "You need to be authenticated to access this page.",
          variant: "destructive",
        });
      } else {
        setAuthStatus("Authenticated as " + (data.session?.user?.email || "anonymous user"));
        toast({
          title: "Authentication Success",
          description: "You are authenticated and can create services.",
          variant: "default",
        });
      }
    }
    
    checkAuthentication();
  }, [toast]);

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

      console.log("Submitting form data:", formData);

      // Create service
      const result = await createService({
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        active: formData.active,
        hsn_code: formData.hsn_code,
        gst_rate: Number.parseFloat(formData.gst_rate),
      })

      if (!result) {
        toast({
          title: "Error",
          description: "Failed to add item. Check console for details.",
          variant: "destructive",
        })
        return;
      }

      toast({
        title: "Success",
        description: "Item added successfully",
      })

      router.push("/services")
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: "Failed to add item. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Add New Item</h1>
      <div className="mb-4 text-sm">
        Authentication Status: {authStatus}
      </div>

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>Add a new product or service to your catalog</CardDescription>
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
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

