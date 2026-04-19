import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import RoomChat from '@/components/RoomChat';
import ReportEngine from '@/components/ReportEngine';
import MentorSidebar from '@/components/MentorSidebar';
import FounderDNA from '@/components/FounderDNA';

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await getSession();
  if (!session?.userId) redirect('/login');

  if (!adminDb) {
    throw new Error('Firebase Admin SDK is not properly initialized. Check environment variables.');
  }

  // Single fetch — room doc already has messageCount
  const roomDoc = await adminDb.collection('ideaRooms').doc(id).get();
  if (!roomDoc.exists) redirect('/dashboard');
  
  const room = roomDoc.data()!;
  if (room.userId !== session.userId) redirect('/dashboard');

  const messageCount = room.messageCount || 0;

  // WhatsApp Config
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || '+14155238886'; 
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace('whatsapp:', '').replace('+', '')}?text=START_${id}`;

  // Telegram Config
  const telegramBotName = process.env.TELEGRAM_BOT_USERNAME || 'JudgeAIBot';
  const telegramUrl = `https://t.me/${telegramBotName}?start=${id}`;

  return (
    <div className="flex flex-col h-full -m-8 lg:-m-10">
      {/* Top Bar */}
      <div className="px-8 py-3 border-b border-[rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-[#64748B] hover:text-[#1E293B] flex items-center gap-2 transition text-[14px]">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="h-5 w-px bg-[rgba(0,0,0,0.08)]" />
          <div>
            <h1 className="text-[18px] font-bold text-[#1E293B] tracking-tight">{room.ideaName}</h1>
            <p className="text-[12px] text-[#94A3B8]">Vetting Session Active</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Stress Test Active</span>
          </div>
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#0088cc]/5 hover:bg-[#0088cc]/10 border border-[#0088cc]/20 text-[#0088cc] px-3 py-1.5 rounded-lg font-medium text-[12px] transition">
            <Send className="w-3.5 h-3.5" /> Telegram
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 px-3 py-1.5 rounded-lg font-medium text-[12px] transition">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Mentor Sidebar — independent scroll */}
        <aside className="w-[240px] border-r border-[rgba(0,0,0,0.06)] bg-white hidden xl:flex flex-col shrink-0">
          <div className="p-6 overflow-y-auto flex-1">
            <MentorSidebar ideaName={room.ideaName} messageCount={messageCount} />
          </div>
        </aside>

        {/* Center: Chat — its own scroll */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <RoomChat roomId={id} />
        </div>

        {/* Right: Founder DNA + Report — STICKY: fixed position, independent internal scroll */}
        <aside className="w-[280px] border-l border-[rgba(0,0,0,0.06)] bg-white hidden lg:flex flex-col shrink-0 h-full">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <FounderDNA roomId={id} messageCount={messageCount} />
            <div className="pt-5 border-t border-[rgba(0,0,0,0.06)]">
              <ReportEngine roomId={id} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
