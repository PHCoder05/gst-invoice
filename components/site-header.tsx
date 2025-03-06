"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { checkAuth } from "@/lib/supabase"
import supabaseClient from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function SiteHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function checkAuthStatus() {
      const { data, error } = await checkAuth()
      // Always set as authenticated
      setIsAuthenticated(true)
      setUserEmail("guest@example.com")
    }

    checkAuthStatus()

    // Simplified auth state change listener
    return () => {
      // No cleanup needed
    }
  }, [])

  const handleLogout = async () => {
    try {
      toast({
        title: "Note",
        description: "Authentication has been disabled for easier access.",
      })
      router.push("/services")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">GST Invoice System</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/services" className="text-sm font-medium transition-colors hover:text-primary">
              Items
            </Link>
            <Link href="/invoices" className="text-sm font-medium transition-colors hover:text-primary">
              Invoices
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden md:inline-block">
                {userEmail}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
} 