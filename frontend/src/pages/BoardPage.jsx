import React from 'react'
import FabricCanvas from '../canvas/FabricCanvas'
import SidebarToolbar from '../components/Toolbar/SidebarToolbar'
import Topbar from '../components/Topbar/Topbar'

export default function BoardPage() {
  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <Topbar />
      <SidebarToolbar />
      <main className="absolute inset-0 p-6">
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-white/3">
          <FabricCanvas />
        </div>
      </main>
    </div>
  )
}
