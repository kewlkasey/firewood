
import { APP_VERSION } from "@/lib/version"

export function VersionFooter() {
  return (
    <div className="text-center py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
      Version {APP_VERSION}
    </div>
  )
}
