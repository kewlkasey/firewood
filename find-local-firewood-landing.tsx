import Link from "next/link"
import Image from "next/image"
import { MapPin, ChevronRight, TreesIcon as Tree, Truck, Wallet, Shield, Users, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FindLocalFirewoodLanding() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Tree className="h-6 w-6 text-[#2d5d2a]" />
            <span className="text-xl font-bold text-[#2d5d2a]">FindLocalFirewood</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#" className="text-[#5e4b3a] hover:text-[#2d5d2a] font-medium transition-colors">
              Find Stands
            </Link>
            <Link href="/list-your-stand" className="text-[#5e4b3a] hover:text-[#2d5d2a] font-medium transition-colors">
              List A Stand
            </Link>
            <Link href="#" className="text-[#5e4b3a] hover:text-[#2d5d2a] font-medium transition-colors">
              About
            </Link>
          </nav>
          <div className="hidden md:flex gap-3">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-[#2d5d2a] text-[#2d5d2a] hover:bg-[#2d5d2a]/10 bg-transparent"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">Sign Up</Button>
            </Link>
          </div>
          <Button variant="outline" size="icon" className="md:hidden bg-transparent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-[#f5f1e8] to-white">
          <div className="container flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#5e4b3a]">
                Find Local Firewood Stands Near You
              </h1>
              <p className="text-lg md:text-xl text-[#5e4b3a]/80 max-w-xl mx-auto md:mx-0">
                Discover honor-system roadside firewood stands in your area. Support local suppliers and get quality
                firewood for your home.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white h-12 px-6 rounded-md">
                  Find Firewood Stands
                  <MapPin className="ml-2 h-5 w-5" />
                </Button>
                <Link href="/list-your-stand">
                  <Button
                    variant="outline"
                    className="border-[#5e4b3a] text-[#5e4b3a] hover:bg-[#5e4b3a]/10 h-12 px-6 rounded-md bg-transparent"
                  >
                    List A Stand
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 relative">
              <Image
                src="/placeholder.svg?height=400&width=500"
                width={500}
                height={400}
                alt="Firewood stand by the roadside"
                className="rounded-lg shadow-lg"
                priority
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#5e4b3a] mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f5f1e8] flex items-center justify-center mb-2">
                  <MapPin className="h-8 w-8 text-[#2d5d2a]" />
                </div>
                <h3 className="text-xl font-semibold text-[#5e4b3a]">Search Your Location</h3>
                <p className="text-[#5e4b3a]/80">
                  Enter your location to find firewood stands near you. Filter by distance, wood type, or price.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f5f1e8] flex items-center justify-center mb-2">
                  <Truck className="h-8 w-8 text-[#2d5d2a]" />
                </div>
                <h3 className="text-xl font-semibold text-[#5e4b3a]">Find Nearby Stands</h3>
                <p className="text-[#5e4b3a]/80">
                  Browse through available stands, view photos, read reviews, and get directions to your chosen
                  location.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f5f1e8] flex items-center justify-center mb-2">
                  <Wallet className="h-8 w-8 text-[#2d5d2a]" />
                </div>
                <h3 className="text-xl font-semibold text-[#5e4b3a]">Visit & Pay</h3>
                <p className="text-[#5e4b3a]/80">
                  Visit the stand, select your firewood, and pay using the honor system. Support local suppliers
                  directly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* For Stand Owners Section */}
        <section className="py-16 md:py-24 bg-[#f5f1e8]">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="flex-1 relative order-2 md:order-1">
                <Image
                  src="/placeholder.svg?height=400&width=500"
                  width={500}
                  height={400}
                  alt="Person stacking firewood at a roadside stand"
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="flex-1 space-y-6 order-1 md:order-2">
                <h2 className="text-3xl md:text-4xl font-bold text-[#5e4b3a]">For Firewood Stand Owners</h2>
                <p className="text-lg text-[#5e4b3a]/80">
                  Have excess firewood to sell? List your roadside stand on our platform and connect with local
                  customers looking for quality firewood.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#2d5d2a] flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-[#5e4b3a]">Increase visibility of your roadside stand</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#2d5d2a] flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-[#5e4b3a]">Connect with customers in your local area</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#2d5d2a] flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-[#5e4b3a]">Simple listing process with photos and details</span>
                  </li>
                </ul>
                <Link href="/list-your-stand?owner=true">
                  <Button className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">List Your Stand</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Community/Trust Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#5e4b3a] mb-12">
              Built on Community Trust
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="bg-[#f5f1e8] p-8 rounded-lg shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <Shield className="h-10 w-10 text-[#2d5d2a]" />
                  <h3 className="text-xl font-semibold text-[#5e4b3a]">The Honor System</h3>
                </div>
                <p className="text-[#5e4b3a]/80">
                  FindLocalFirewood is built on the traditional honor system that has been a cornerstone of rural
                  communities for generations. Stand owners provide quality firewood and trust customers to pay fairly,
                  while customers trust that the wood is as described.
                </p>
              </div>
              <div className="bg-[#f5f1e8] p-8 rounded-lg shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <Users className="h-10 w-10 text-[#2d5d2a]" />
                  <h3 className="text-xl font-semibold text-[#5e4b3a]">Community Reviews</h3>
                </div>
                <p className="text-[#5e4b3a]/80">
                  Our platform allows customers to leave reviews and ratings for stands they've visited, helping to
                  build a trusted community of firewood suppliers and buyers. This transparency benefits everyone and
                  maintains the quality of listings.
                </p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <p className="text-lg text-[#5e4b3a]/80 max-w-2xl mx-auto mb-6">
                Join thousands of community members already supporting local firewood suppliers through our platform.
              </p>
              <Button className="bg-[#2d5d2a] hover:bg-[#1e3d1c] text-white">Join Our Community</Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-[#2d5d2a]">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Find Local Firewood?</h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
              Join our community today and discover quality firewood stands in your area, or list your own stand to
              connect with local customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-[#2d5d2a] hover:bg-white/90 h-12 px-6 rounded-md">
                Find Firewood Stands
              </Button>
              <Link href="/list-your-stand">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 h-12 px-6 rounded-md bg-transparent"
                >
                  List A Stand
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#5e4b3a] text-white/80 py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tree className="h-6 w-6 text-white" />
                <span className="text-xl font-bold text-white">FindLocalFirewood</span>
              </div>
              <p className="text-sm text-white/70">
                Connecting communities with local firewood suppliers through honor-system roadside stands.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Find Stands
                  </Link>
                </li>
                <li>
                  <Link href="/list-your-stand" className="hover:text-white transition-colors">
                    List A Stand
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Firewood Guide
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Stand Owner Tips
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Community Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact Us</h4>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:info@localfirewood.com" className="hover:text-white transition-colors">
                    info@localfirewood.com
                  </a>
                </p>
                <p className="text-sm text-white/70 mt-4">Have questions or suggestions? We'd love to hear from you!</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} FindLocalFirewood. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
