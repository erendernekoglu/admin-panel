import type { ReactNode } from "react"
import { useState } from "react"
import { useLocation } from "react-router"

import { Sidebar } from "../../organisms/Sidebar"
import { Topbar } from "../../organisms/Topbar"

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col md:pl-[264px]">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
          {/* Keyed by route so each screen settles in once when you navigate to it. */}
          <div className="mx-auto w-full max-w-[1400px] animate-rise-in space-y-8" key={pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
