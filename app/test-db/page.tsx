import DatabaseTestButton from "../../components/database-test-button"
import Link from "next/link"
import { TreesIcon as Tree } from "lucide-react"

export default function TestDatabasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <Tree className="h-8 w-8 text-[#2d5d2a]" />
            <span className="text-2xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#5e4b3a] mb-4">Database Test</h1>
          <p className="text-[#5e4b3a]/70">Test your Supabase database connection and functionality.</p>
        </div>

        <DatabaseTestButton />

        <div className="mt-8 text-center">
          <Link href="/" className="text-[#2d5d2a] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
