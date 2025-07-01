import type React from "react"
import Link from "next/link"
import { TreesIcon as Tree } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <Tree className="h-8 w-8 text-[#2d5d2a]" />
            <span className="text-2xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
          </Link>
          <h2 className="text-3xl font-bold text-[#5e4b3a]">{title}</h2>
          <p className="mt-2 text-sm text-[#5e4b3a]/70">{subtitle}</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">{children}</div>
      </div>
    </div>
  )
}
