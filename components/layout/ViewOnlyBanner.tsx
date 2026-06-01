type ViewOnlyBannerProps = {
  role: 'admin' | 'viewer'
}

export default function ViewOnlyBanner({ role }: ViewOnlyBannerProps) {
  if (role !== 'viewer') {
    return null
  }

  return (
    <div className="border-b border-emerald-500/25 bg-emerald-500/10 px-6 py-2 text-xs font-medium text-emerald-100">
      View-only access: live pages are available for review. Move, reassignment, and write actions are disabled.
    </div>
  )
}
