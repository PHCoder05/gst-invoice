"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Home, Package, CreditCard } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="font-bold text-xl flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          GST Invoice System
        </Link>

        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant={pathname === "/" ? "default" : "ghost"} size="sm">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/services">
            <Button variant={pathname.startsWith("/services") ? "default" : "ghost"} size="sm">
              <Package className="mr-2 h-4 w-4" />
              Services
            </Button>
          </Link>
          <Link href="/transactions">
            <Button variant={pathname.startsWith("/transactions") ? "default" : "ghost"} size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Transactions
            </Button>
          </Link>
          <Link href="/payments/create">
            <Button variant={pathname.startsWith("/payments") ? "default" : "ghost"} size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              Payment Links
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

