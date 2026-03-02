import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center flex flex-col items-center w-full">
        
        {/* Logo Image & Text */}
        <div className="flex flex-col items-center gap-4">
          <Image 
            src="/login.svg" 
            alt="BlueLineOps Logo" 
            width={120} 
            height={120} 
            className="drop-shadow-xl"
          />
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter">
            <span className="text-blue-600">Blue</span>
            <span className="text-white-90">LineOps</span>
          </h1>
        </div>
        
        <p className="mt-6 text-xl md:text-2xl font-light text-white-90 max-w-lg">
          Operational Intelligence for Logistics
        </p>

        {/* High-End Glossy Hover Tiles */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl px-6">
          <Link href="/login" className="group">
            <div className="h-full flex flex-col items-center justify-center p-8 rounded-2xl bg-white/90 backdrop-blur-xl border border-zinc-200/50 transition-all duration-500 ease-out shadow-sm hover:scale-[1.02] hover:bg-white hover:border-zinc-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] cursor-pointer">
              <span className="text-2xl font-medium mb-2 text-zinc-800 group-hover:text-blue-600 transition-colors duration-500">Sign In</span>
              <span className="text-sm text-zinc-500 transition-colors duration-500">Admin Access</span>
            </div>
          </Link>

          <Link href="/dashboard" className="group">
            <div className="h-full flex flex-col items-center justify-center p-8 rounded-2xl bg-white/90 backdrop-blur-xl border border-zinc-200/50 transition-all duration-500 ease-out shadow-sm hover:scale-[1.02] hover:bg-white hover:border-blue-200 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.1)] cursor-pointer">
              <span className="text-2xl font-medium mb-2 text-zinc-800 group-hover:text-blue-600 transition-colors duration-500">Dashboard</span>
              <span className="text-sm text-zinc-500 transition-colors duration-500">Enter operations</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}