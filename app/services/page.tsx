"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Plus, Search, Trash } from "lucide-react"
import { getServices, deleteService, type Service, checkAuth } from "@/lib/supabase"
import supabaseClient from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [authStatus, setAuthStatus] = useState<string>("Checking...")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function checkAuthentication() {
      const { data, error } = await checkAuth();
      if (error || !data || !data.session) {
        setAuthStatus("Not authenticated");
        toast({
          title: "Authentication Required",
          description: "Please log in to manage services",
          variant: "destructive",
        });
      } else {
        setAuthStatus("Authenticated as " + (data.session?.user?.email || "unknown"));
      }
      fetchServices();
    }
    
    checkAuthentication();
  }, [toast, router]);

  const fetchServices = async () => {
    setLoading(true)
    try {
      const data = await getServices()
      if (data) {
        setServices(data as Service[])
      }
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        toast({
          title: "Logout Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logged Out",
          description: "You have been logged out successfully",
        });
        router.push("/login");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  async function handleDeleteService(id: string) {
    try {
      await deleteService(id)
      setServices(services.filter((service) => service.id !== id))
      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.hsn_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products & Services</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      <div className="mb-4 text-sm">
        Authentication Status: {authStatus}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading items...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>HSN/SAC</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>GST Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No items found. <Link href="/services/new" className="text-blue-500 hover:underline">Add your first item</Link>
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.hsn_code}</TableCell>
                  <TableCell>₹{service.price.toFixed(2)}</TableCell>
                  <TableCell>{service.gst_rate}%</TableCell>
                  <TableCell>
                    {service.active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/services/${service.id}`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the item. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

