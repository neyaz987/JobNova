import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Navbar from './Navbar'
import { useWebsocket } from '../../hooks/useWebsocket'

interface LayoutProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export default function Layout({ children, className = '', fullWidth = false }: LayoutProps) {
  const mainRef = useRef(null)
  useWebsocket() // Initialize global websocket connection

  useEffect(() => {
    gsap.fromTo(mainRef.current, 
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )

    // Global Cursor Glow
    const moveGlow = (e: MouseEvent) => {
      gsap.to('.cursor-glow', {
        x: e.clientX,
        y: e.clientY,
        duration: 0.8,
        ease: 'power2.out'
      })
    }
    window.addEventListener('mousemove', moveGlow)
    return () => window.removeEventListener('mousemove', moveGlow)
  }, [])

  return (
    <div 
      className="min-h-screen flex flex-col selection:bg-indigo-500/30 bg-[#020617] relative overflow-x-hidden"
      style={{ perspective: '2000px' }}
    >
      <div className="cursor-glow hidden lg:block" />
      <div className="noise-overlay" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>
      <div className="fixed inset-0 bg-grid-blueprint pointer-events-none opacity-50" />
      
      <Navbar />

      <main
        ref={mainRef}
        className={`flex-1 pt-24 ${className}`}
      >
        <div className={fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          {children}
        </div>
      </main>

      <footer className="border-t border-white/5 py-12 mt-auto glass-dark backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20">
                  <img src="/logo.png" alt="JobNova" className="w-full h-full object-cover" />
                </div>
                <span className="font-display font-bold text-2xl tracking-tighter gradient-text">JobNova</span>
              </div>
              <p className="text-white/30 text-xs font-medium tracking-wide text-center md:text-left">
                Empowering the next generation of top-tier talent through AI.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-white/30">
                <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
              </div>
              <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
                © {new Date().getFullYear()} JobNova Labs. All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
