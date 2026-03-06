import Image from "next/image"
import LandingKpiTile from "@/components/landing/LandingKpiTile"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden text-zinc-100 bg-[radial-gradient(1200px_circle_at_50%_-10%,rgba(71,85,105,0.25),transparent_55%),radial-gradient(700px_circle_at_100%_0%,rgba(30,64,175,0.12),transparent_52%),linear-gradient(180deg,#111315_0%,#0b0d10_100%)]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(148,163,184,0.06),transparent_40%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center flex flex-col items-center w-full">
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/login.svg"
            alt="BlueLineOps Logo"
            width={340}
            height={340}
            className="relative z-0 h-[230px] w-[230px] md:h-[330px] md:w-[330px] -mb-8 md:-mb-12 object-contain opacity-90 contrast-125 saturate-125 drop-shadow-[0_18px_28px_rgba(2,6,23,0.7)] drop-shadow-[0_0_22px_rgba(59,130,246,0.28)]"
          />
          <h1 className="relative z-10 text-7xl md:text-9xl font-bold tracking-tighter">
            <span className="text-blue-400">Blue</span>
            <span className="text-zinc-200">LineOps</span>
          </h1>
        </div>
        
        <p className="mt-6 text-xl md:text-2xl font-light text-zinc-300 max-w-lg">
          Operational Intelligence for Logistics
        </p>

        <div className="mt-12 w-full max-w-md px-6">
          <LandingKpiTile
            href="/dashboard"
            title="Enterprise Login"
            subtitle="Continue with SSO"
          />
        </div>
      </div>
    </div>
  )
}
