'use client'

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/src/lib/supabase"
import type { Database } from "@/src/types/database.types"
import { User, Activity, Terminal, MessageCircle, ChevronLeft } from "lucide-react"
import gsap from "gsap"
import Link from "next/link"

type ComplaintRow = Database["public"]["Tables"]["complaints"]["Row"]

export default function CMProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [criticalTickets, setCriticalTickets] = useState<ComplaintRow[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [totalIssues, setTotalIssues] = useState(0)
  const [criticalPending, setCriticalPending] = useState(0)

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editData, setEditData] = useState({ fullName: "", username: "" })
  const [isSaving, setIsSaving] = useState(false)

  // WhatsApp Linking States
  const [waLinkCode, setWaLinkCode] = useState<string | null>(null)
  const [isGeneratingWA, setIsGeneratingWA] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const leftColRef = useRef<HTMLDivElement>(null)
  const emblemRef = useRef<HTMLDivElement>(null)
  const rightBoxesRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data?.user
      setUser(currentUser)

      // Fetch global stats for CM
      supabase
        .from("complaints")
        .select("id", { count: 'exact', head: true })
        .then(({ count }) => {
          if (count !== null) setTotalIssues(count)
        })

      // Fetch active critical
      supabase
        .from("complaints")
        .select("id", { count: 'exact', head: true })
        .in("severity", ["L4"])
        .not("status", "in", '("resolved", "rejected")')
        .then(({ count }) => {
          if (count !== null) setCriticalPending(count)
        })

      // Fetch recent critical for terminal
      supabase
        .from("complaints")
        .select("*")
        .in("severity", ["L4"])
        .order("updated_at", { ascending: false })
        .limit(4)
        .then(({ data }) => {
          if (data) setCriticalTickets(data)
          setLoadingTickets(false)
        })

      if (currentUser) {
        // Fetch Profile on load
        supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setProfile(data)
              if (data.whatsapp_link_code) setWaLinkCode(data.whatsapp_link_code)
            }
          })
      } else {
        setLoadingTickets(false)
      }
      
      setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    if (!authChecked || !containerRef.current) return;
    
    // Cleanup any existing animations when unmounting
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // 1. Initial container flash/glitch
      gsap.set(containerRef.current, { opacity: 0, scale: 0.98 })
      tl.to(containerRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power2.out"
      })

      // 2. Left column text stagger
      if (leftColRef.current) {
        const leftElements = gsap.utils.toArray(leftColRef.current.children)
        tl.fromTo(leftElements, 
          { x: -50, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: "power3.out" },
          "-=0.4"
        )
      }

      // 3. Subtle Emblem Fade-in
      if (emblemRef.current) {
        tl.fromTo(emblemRef.current,
          { opacity: 0, filter: 'blur(8px)' },
          { opacity: 1, filter: 'blur(0px)', duration: 1.5, ease: "power2.inOut" },
          "-=0.4"
        )
      }

      // 4. Right boxes slide in
      if (rightBoxesRef.current) {
        const boxes = gsap.utils.toArray(rightBoxesRef.current.children)
        tl.fromTo(boxes, 
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.2, duration: 0.6, ease: "power3.out" },
          "-=0.6"
        )
      }

      // 5. Bottom terminal lines stagger
      if (bottomRef.current && !loadingTickets) {
        const bottomElements = gsap.utils.toArray(bottomRef.current.children)
        tl.fromTo(bottomElements, 
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.15, duration: 0.5, ease: "power2.out" },
          "-=0.4"
        )
      }
    }, [authChecked, loadingTickets]) 

    return () => ctx.revert()
  }, [authChecked, loadingTickets])

  // Interactive click handler for UI elements
  const handleInteraction = (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
    const el = e.currentTarget
    gsap.timeline()
      .to(el, { scale: 0.95, duration: 0.05 })
      .to(el, { opacity: 0.5, duration: 0.05 })
      .to(el, { opacity: 1, scale: 1, duration: 0.1, ease: "back.out(2)" })
      .to(el, { x: 2, duration: 0.05, yoyo: true, repeat: 3 })
  }

  // Handle clicking a specific ticket link
  const handleTicketClick = (e: React.MouseEvent<HTMLElement>, ticketId: string) => {
    e.stopPropagation()
    handleInteraction(e)
  }

  // Handlers for Profile Editing
  const nameDisplay = 'CM of Delhi'
  const emailDisplay = 'cm.delhi@gov.in'
  const usernameDisplay = 'cm_delhi'

  const handleEditProfile = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    handleInteraction(e)
    setEditData({ fullName: nameDisplay, username: usernameDisplay })
    setIsEditingProfile(true)
  }

  const handleCancelEdit = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    handleInteraction(e)
    setIsEditingProfile(false)
  }

  const handleSaveProfile = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    handleInteraction(e)
    if (!editData.fullName.trim() || !editData.username.trim() || isSaving) return;
    if (!user) {
      alert("You must be logged in to save profile changes.");
      setIsEditingProfile(false)
      return;
    }

    setIsSaving(true)
    const { data, error } = await supabase.auth.updateUser({
      data: { 
        full_name: editData.fullName,
        username: editData.username.replace(/[^a-zA-Z0-9_]/g, '_')
      }
    })
    
    if (!error && data?.user) {
      setUser(data.user)
    }
    
    setTimeout(() => {
      setIsEditingProfile(false)
      setIsSaving(false)
    }, 300)
  }

  const handleGenerateWACode = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    handleInteraction(e)
    if (!user || isGeneratingWA) {
      if (!user) alert("You must be logged in to link WhatsApp.");
      return;
    }

    setIsGeneratingWA(true)
    const code = `ALERT-${Math.floor(1000 + Math.random() * 9000)}`
    
    const { error } = await supabase.from('profiles').update({ whatsapp_link_code: code }).eq('id', user.id)
    
    if (!error) {
      setWaLinkCode(code)
    }
    setIsGeneratingWA(false)
  }

  const handleUnlinkWA = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    handleInteraction(e)
    if (!user || isGeneratingWA) return;

    const confirmed = confirm("Unlink Secure Alert Channel? You will need to regenerate a code to receive high-priority alerts via message.")
    if (!confirmed) return;

    setIsGeneratingWA(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        phone: null, 
        whatsapp_link_code: null 
      })
      .eq('id', user.id)
    
    if (!error) {
      setWaLinkCode(null)
      setProfile((prev: any) => ({ ...prev, phone: null, whatsapp_link_code: null }))
    }
    setIsGeneratingWA(false)
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[#fcfbf9] dark:bg-[#0c0c0c] font-mono">
        <div className="text-gray-800 dark:text-[#C9A84C] animate-pulse text-xl shadow-none dark:shadow-[0_0_10px_#C9A84C]">
          INITIALIZING SECURE LINK...
        </div>
      </div>
    )
  }

  const styles = `
    .terminal-container {
      background-color: #fafafa;
      transition: background-color 0.3s ease;
    }
    .dark .terminal-container {
      background-color: #161616;
      background-image: radial-gradient(circle, #211c10 0%, #0c0c0c 100%);
    }
    .scanlines {
      display: none;
    }
    .dark .scanlines {
      display: block;
      background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
      background-size: 100% 4px;
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
    }
    .flicker {
      animation: flicker 0.15s infinite;
    }
    @keyframes flicker {
      0% { opacity: 0.98; }
      50% { opacity: 1; }
      100% { opacity: 0.98; }
    }
    .glow-gold {
      color: #1f2937;
    }
    .dark .glow-gold {
      color: #C9A84C;
      text-shadow: 0 0 5px rgba(201, 168, 76, 0.4), 0 0 10px rgba(201, 168, 76, 0.2);
    }
    .glow-border {
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    }
    .dark .glow-border {
      border: 2px solid rgba(201, 168, 76, 0.6);
      box-shadow: inset 0 0 10px rgba(201, 168, 76, 0.1), 0 0 10px rgba(201, 168, 76, 0.2);
    }
    .gold-highlight {
      background-color: #e6ddc5;
      color: #1f2937;
    }
    .dark .gold-highlight {
      background-color: #C9A84C;
      color: #0c0c0c;
      box-shadow: 0 0 15px rgba(201, 168, 76, 0.5);
    }
    .interactive-item {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dark .interactive-item {
      cursor: crosshair;
    }
    .interactive-item:hover {
      background-color: #f3f4f6;
    }
    .dark .interactive-item:hover {
      background-color: rgba(201, 168, 76, 0.1);
      box-shadow: inset 0 0 10px rgba(201, 168, 76, 0.2);
    }
    button {
      outline: none;
    }
    .emblem-mask {
      background-color: #374151;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    }
    .dark .emblem-mask {
      background-color: #C9A84C;
      filter: drop-shadow(0 0 15px rgba(201, 168, 76, 0.8));
    }
  `

  return (
    <div className="h-screen w-full relative overflow-y-auto overflow-x-hidden terminal-container p-4 sm:p-8 font-mono text-xs sm:text-sm md:text-base flex flex-col font-bold" ref={containerRef}>
      <style>{styles}</style>
      <div className="scanlines flicker"></div>
      
      {/* Top Nav */}
      <div className="relative z-30 w-full max-w-7xl mx-auto mb-6">
        <Link 
          href="/cm" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-[#C9A84C] dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> [ BACK TO COMMAND CENTER ]
        </Link>
      </div>

      <div className="relative z-20 flex flex-col min-h-full glow-gold max-w-7xl mx-auto w-full">
        
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-8 cursor-default">
          
          {/* Left Column: Intro */}
          <div className="flex-1 flex flex-col justify-center gap-4" ref={leftColRef}>
            <button className="text-xl sm:text-3xl tracking-widest interactive-item w-fit px-2 py-1 rounded text-left" onClick={handleInteraction}>
              Command Center Auth,
            </button>
            
            <button 
              className="gold-highlight px-4 sm:px-6 py-2 text-3xl sm:text-4xl md:text-5xl font-extrabold text-left w-full md:w-fit uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 break-words"
              onClick={handleInteraction}
            >
              I'm <br className="md:hidden" />{nameDisplay}
            </button>
            
            <div className="space-y-3 text-lg sm:text-xl md:text-2xl pl-5 border-l-4 border-[#C9A84C]/60 py-2">
              <button className="flex items-center gap-3 interactive-item w-full text-left px-2 py-1 rounded" onClick={handleInteraction}>
                <span className="text-gray-800 dark:text-[#C9A84C] w-2 h-2 bg-[#C9A84C] shadow-none dark:shadow-[0_0_8px_#C9A84C]"></span> 
                Chief Minister
              </button>
              <button className="flex items-center gap-3 interactive-item w-full text-left px-2 py-1 rounded" onClick={handleInteraction}>
                <span className="text-gray-800 dark:text-[#C9A84C] w-2 h-2 bg-[#C9A84C] shadow-none dark:shadow-[0_0_8px_#C9A84C]"></span> 
                Delhi Executive
              </button>
            </div>
          </div>
          
          {/* Center Column: Emblem */}
          <div className="hidden lg:flex flex-col items-center justify-center relative w-64 lg:w-80 flex-shrink-0" ref={emblemRef}>
            <div className="absolute inset-0 bg-[#C9A84C]/10 blur-3xl rounded-full pointer-events-none"></div>
            <button 
              className="w-full aspect-[3/4] max-h-[400px] emblem-mask hover:scale-105 transition-transform duration-500 cursor-pointer dark:cursor-crosshair"
              onClick={handleInteraction}
              style={{
                WebkitMaskImage: 'url(/Emblem.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskImage: 'url(/Emblem.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center'
              }}
            />
          </div>
          
          {/* Right Column: Stats & Details */}
          <div className="flex-1 flex flex-col gap-6 justify-center" ref={rightBoxesRef}>
            
            {/* Profile Details Box */}
            <div className="glow-border p-5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-md text-left w-full relative overflow-hidden group cursor-default">
              <div className="absolute inset-0 bg-[#C9A84C]/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
              
              <div className="relative z-10 flex justify-between items-center mb-5 border-b-2 border-gray-200 dark:border-[#C9A84C]/40 pb-3">
                <div className="flex items-center gap-3 font-bold text-lg sm:text-xl uppercase tracking-wider">
                  <User size={24} /> PROFILE DETAILS
                </div>
              </div>
              
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-[#C9A84C]/50 dark:border-[#C9A84C]/20 pb-2">
                  <span className="text-gray-600 dark:text-[#C9A84C]/70 tracking-wider pt-1">FULL NAME:</span>
                  {!isEditingProfile ? (
                    <span className="font-bold uppercase truncate">{nameDisplay}</span>
                  ) : (
                    <input 
                      type="text" 
                      value={editData.fullName}
                      onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                      className="bg-[#C9A84C]/10 border-b border-[#C9A84C] text-gray-800 dark:text-[#C9A84C] focus:outline-none focus:bg-[#C9A84C]/20 px-2 py-1 font-bold uppercase w-full sm:w-1/2 text-left sm:text-right rounded-t transition-colors"
                      placeholder="ENTER FULL NAME"
                    />
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-[#C9A84C]/50 dark:border-[#C9A84C]/20 pb-2">
                  <span className="text-gray-600 dark:text-[#C9A84C]/70 tracking-wider pt-1">USERNAME:</span>
                  {!isEditingProfile ? (
                    <span className="font-bold truncate">[{usernameDisplay}]</span>
                  ) : (
                    <div className="flex w-full sm:w-1/2 justify-start sm:justify-end items-center">
                      <span className="mr-1 pt-1 opacity-70">[</span>
                      <input 
                        type="text" 
                        value={editData.username}
                        onChange={(e) => setEditData({...editData, username: e.target.value.replace(/\s+/g, '_').toLowerCase()})}
                        className="bg-[#C9A84C]/10 border-b border-[#C9A84C] text-gray-800 dark:text-[#C9A84C] focus:outline-none focus:bg-[#C9A84C]/20 px-2 py-1 font-bold w-[85%] text-left sm:text-right rounded-t transition-colors"
                        placeholder="ENTER USERNAME"
                      />
                      <span className="ml-1 pt-1 opacity-70">]</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 dark:text-[#C9A84C]/70 tracking-wider pt-1">REGISTERED EMAIL:</span>
                  <span className="font-bold break-all opacity-80 pt-1 text-left sm:text-right">[{emailDisplay}]</span>
                </div>
              </div>

              <div className="relative z-10 mt-6 pt-4 flex justify-end gap-3">
                {/* Edit functionality disabled to preserve separation from personal login credentials */}
              </div>
            </div>

            {/* Delhi Stats Box */}
            <button 
              className="glow-border p-5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-md interactive-item text-left w-full relative overflow-hidden group"
              onClick={handleInteraction}
            >
              <div className="absolute inset-0 bg-[#C9A84C]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 pointer-events-none"></div>
              <div className="relative z-10 flex justify-between items-center mb-5 border-b-2 border-gray-200 dark:border-[#C9A84C]/40 pb-3">
                <div className="flex items-center gap-3 font-bold text-lg sm:text-xl uppercase tracking-wider">
                  <Activity size={24} /> DELHI COMMAND METRICS
                </div>
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between border-b border-[#C9A84C]/50 dark:border-[#C9A84C]/20 pb-2">
                  <span className="text-gray-600 dark:text-[#C9A84C]/70">TOTAL ISSUES TRACKED:</span>
                  <span className="font-bold">{loadingTickets ? "..." : totalIssues.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-[#C9A84C]/50 dark:border-[#C9A84C]/20 pb-2">
                  <span className="text-gray-600 dark:text-[#C9A84C]/70">ACTIVE CRITICAL ESCALATIONS:</span>
                  <span className="font-bold text-red-500">{loadingTickets ? "..." : criticalPending.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-[#C9A84C]/70">DELHI HEALTH SCORE:</span>
                  <span className="font-bold">84 / 100</span>
                </div>
              </div>
            </button>

            {/* WhatsApp Linking Box */}
            <div className="glow-border p-5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-md text-left w-full relative overflow-hidden group cursor-default mt-2">
              <div className="absolute inset-0 bg-red-500/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
              
              <div className="relative z-10 flex justify-between items-center mb-4 border-b-2 border-gray-200 dark:border-red-500/40 pb-3">
                <div className="flex items-center gap-3 font-bold text-lg sm:text-xl uppercase tracking-wider text-red-700 dark:text-red-500">
                  <MessageCircle size={24} /> SECURE ALERT CHANNEL
                </div>
              </div>

              <div className="relative z-10 space-y-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                  {profile?.phone 
                    ? "Command Center alerts are securely routed to your device." 
                    : "Connect device to receive high-priority automated alerts for critical incidents."}
                </p>
                
                {profile?.phone ? (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 border border-red-500/30 bg-red-600/10 dark:bg-red-500/10 rounded flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
                      <div className="absolute inset-0 bg-red-500/5 scanlines pointer-events-none opacity-20"></div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs mb-1 uppercase tracking-widest opacity-80">SECURE LINK ACTIVE</span>
                      <span className="text-xl sm:text-2xl font-black tracking-widest text-red-700 dark:text-red-400 drop-shadow-md">
                        {profile.phone.startsWith('+') ? profile.phone.slice(0, 3) : ''} **** {profile.phone.slice(-4)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-500 text-xs font-bold uppercase tracking-tighter">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
                      CRITICAL ALERTS ENABLED
                    </div>

                    <button 
                      onClick={handleUnlinkWA}
                      disabled={isGeneratingWA}
                      className="w-full border border-red-500/50 text-red-500/80 hover:bg-red-500/10 px-4 py-2 font-bold tracking-widest text-[10px] uppercase transition-colors rounded mt-2"
                    >
                      {isGeneratingWA ? "[ PROCESSING... ]" : "[ DISCONNECT DEVICE ]"}
                    </button>
                  </div>
                ) : !waLinkCode ? (
                  <button 
                    onClick={handleGenerateWACode}
                    disabled={isGeneratingWA}
                    className="w-full bg-red-600 text-white dark:text-[#0c0c0c] px-4 py-3 font-extrabold tracking-widest text-sm uppercase hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50 rounded shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    {isGeneratingWA ? "[ GENERATING CODE... ]" : "[ GENERATE LINK CODE ]"}
                  </button>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 border border-red-500/30 bg-red-600/10 dark:bg-red-500/10 rounded flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-gray-600 dark:text-gray-400 text-xs mb-1 uppercase tracking-widest opacity-80">YOUR SECURE CODE:</span>
                      <span className="text-2xl sm:text-3xl font-black tracking-widest text-red-700 dark:text-red-400 drop-shadow-md">{waLinkCode}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        
        {/* Bottom Section: Recent Activity & Terminal Prompt */}
        <div className="w-full flex-grow flex flex-col gap-4">
          <div 
            className="glow-border p-5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-md flex flex-col mb-4 interactive-item text-left relative overflow-hidden group flex-shrink-0"
            onClick={handleInteraction}
          >
             <div className="absolute inset-0 bg-[#C9A84C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
             <div className="relative z-10 flex justify-between items-center mb-4 border-b-2 border-gray-200 dark:border-[#C9A84C]/40 pb-3 w-full">
                <div className="flex items-center gap-3 font-bold text-lg sm:text-xl uppercase tracking-wider w-full">
                  LATEST CRITICAL ISSUES
                </div>
                <div className="text-gray-500 dark:text-[#C9A84C]/60"><Terminal size={20} /></div>
              </div>
              <div className="relative z-10 space-y-3 font-mono text-sm sm:text-base leading-relaxed" ref={bottomRef}>
                {loadingTickets ? (
                  <div className="text-gray-400 dark:text-[#C9A84C]/50 animate-pulse tracking-widest">{">"} SCANNING DATABASE...</div>
                ) : criticalTickets.length === 0 ? (
                  <div className="text-gray-400 dark:text-[#C9A84C]/50 tracking-widest">{">"} NO CRITICAL TICKETS DETECTED.</div>
                ) : (
                  criticalTickets.map((ticket, i) => (
                    <button key={ticket.id} onClick={(e) => handleTicketClick(e, ticket.id)} className={`flex flex-wrap gap-x-2 gap-y-1 hover:bg-[#C9A84C]/10 p-1 -m-1 rounded transition-colors w-full text-left interactive-item ${i > 0 && ticket.status !== 'submitted' && ticket.status !== 'in_progress' ? 'opacity-80' : ''}`}>
                      <span className="text-gray-800 dark:text-[#C9A84C] mr-2 flex-shrink-0">{'>'} ISSUE #{ticket.ticket_id || ticket.id.slice(0,6)}:</span>
                      <span className="text-gray-700 dark:text-[#C9A84C]/80 uppercase">Status - {ticket.status?.replace('_', ' ') || "unknown"}</span>
                      <span className="hidden sm:inline"> | </span>
                      <span className="w-full sm:w-auto text-red-500">{ticket.title}</span>
                    </button>
                  ))
                )}
              </div>
          </div>

          <button 
            className="mt-auto text-xl sm:text-3xl font-bold py-2 tracking-widest flex items-center w-fit interactive-item px-4 rounded mb-10"
            onClick={handleInteraction}
          >
            SYS: ~$ <span className="animate-pulse w-4 h-6 sm:h-8 bg-[#C9A84C] shadow-none dark:shadow-[0_0_10px_#C9A84C] ml-2 block"></span>
          </button>
        </div>

      </div>
    </div>
  )
}
