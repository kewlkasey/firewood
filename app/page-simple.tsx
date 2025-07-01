import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TreesIcon as Tree } from "lucide-react"

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Tree className="h-8 w-8 text-[#2d5d2a]" />
          <span className="text-2xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
        </div>

        <h1 className="text-4xl font-bold text-[#5e4b3a] mb-6">Welcome to FindLocalFirewood</h1>

        <p className="text-lg text-[#5e4b3a]/80 mb-8 max-w-2xl mx-auto">
          Find local firewood stands in your area or list your own roadside stand.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">Sign Up</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10 bg-transparent">
              Login
            </Button>
          </Link>
          <Link href="/test-db">
            <Button variant="outline" className="border-[#5e4b3a] text-[#5e4b3a] hover:bg-[#5e4b3a]/10 bg-transparent">
              Test Database
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
