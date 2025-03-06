"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import supabaseClient from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Auto-redirect to services page
  useEffect(() => {
    toast({
      title: "Authentication Bypassed",
      description: "Authentication has been disabled for easier access. Redirecting to services page...",
    })
    
    // Redirect after a short delay
    const timer = setTimeout(() => {
      router.push("/services")
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/services")
  }

  const handleSignUp = async () => {
    router.push("/services")
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Bypassed</CardTitle>
          <CardDescription>Authentication has been disabled for easier access. You will be redirected automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-md text-center">
            <p>Redirecting to services page...</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            type="button" 
            className="w-full"
            onClick={() => router.push("/services")}
          >
            Go to Services Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 