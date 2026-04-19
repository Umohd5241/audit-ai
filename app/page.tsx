import Link from 'next/link';
import { ArrowRight, MessageSquare, ShieldAlert, Rocket } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA] text-[#1E293B] font-sans">
      <header className="px-8 py-5 border-b border-[rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-md shadow-[0_0_12px_rgba(99,102,241,0.2)] flex items-center justify-center shrink-0">
               <Rocket className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#1E293B]">THE EQUALS</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-[14px] font-medium text-[#64748B] hover:text-[#1E293B] transition">Login</Link>
            <Link href="/signup" className="text-[14px] font-semibold bg-[#6366f1] hover:bg-[#4f46e5] text-white transition px-5 py-2.5 rounded-lg shadow-[0_4px_15px_rgba(99,102,241,0.2)]">Get Started</Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center mt-20 px-8 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-[48px] md:text-[64px] font-bold tracking-tight mb-6 leading-[1.1] text-[#1E293B]">
            Validate your startup idea directly on <span className="text-[#22c55e]">WhatsApp</span>.
          </h2>
          <p className="text-[18px] text-[#64748B] mb-12 max-w-2xl mx-auto leading-relaxed">
            Pitch your idea to an AI-powered panel of experts. Get real-time feedback, technical feasibility, investor perspectives, and legal insights without leaving your favorite chat app.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-8 py-4 rounded-xl text-[16px] font-semibold transition shadow-[0_4px_25px_rgba(99,102,241,0.25)]">
              Create an Idea Room <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left relative z-10 w-full mb-24">
           <div className="glass-card p-8 rounded-2xl glass-card-hover transition-all duration-300">
             <MessageSquare className="w-8 h-8 text-[#22c55e] mb-6" />
             <h3 className="text-[18px] font-semibold mb-3 text-[#1E293B]">WhatsApp Native</h3>
             <p className="text-[14px] text-[#64748B] leading-relaxed">Instantly connect with your AI mentor through WhatsApp. Fast, conversational, and always accessible.</p>
           </div>
           <div className="glass-card p-8 rounded-2xl glass-card-hover transition-all duration-300">
             <ShieldAlert className="w-8 h-8 text-[#f59e0b] mb-6" />
             <h3 className="text-[18px] font-semibold mb-3 text-[#1E293B]">Devil&apos;s Advocate</h3>
             <p className="text-[14px] text-[#64748B] leading-relaxed">The AI actively tries to find holes in your strategy, highlighting risks you might have missed.</p>
           </div>
           <div className="glass-card p-8 rounded-2xl glass-card-hover transition-all duration-300">
             <Rocket className="w-8 h-8 text-[#a855f7] mb-6" />
             <h3 className="text-[18px] font-semibold mb-3 text-[#1E293B]">Multi-Expert Panel</h3>
             <p className="text-[14px] text-[#64748B] leading-relaxed">Receive feedback synthesized from diverse perspectives: Investor, Tech Lead, and Legal Advisor.</p>
           </div>
        </div>
      </main>

      <footer className="py-8 border-t border-[rgba(0,0,0,0.06)] text-center text-[#94a3b8] text-[13px] bg-white/60">
        &copy; {new Date().getFullYear()} THE EQUALS. Built for validation.
      </footer>
    </div>
  );
}
