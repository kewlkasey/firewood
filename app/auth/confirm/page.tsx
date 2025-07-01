import { Suspense } from "react"
import EmailConfirmation from "../../../components/email-confirmation"
import { TreesIcon as Tree, Loader2 } from "lucide-react"

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1e8] to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Tree className="h-8 w-8 text-[#2d5d2a]" />
            <span className="text-2xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
          </div>
          <h2 className="text-3xl font-bold text-[#5e4b3a]">Email Confirmation</h2>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-[#f5f1e8] rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-[#2d5d2a] animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#5e4b3a]">Loading...</h3>
              <p className="text-sm text-[#5e4b3a]/70">Please wait while we load the confirmation page...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmailConfirmation />
    </Suspense>
  )
}
