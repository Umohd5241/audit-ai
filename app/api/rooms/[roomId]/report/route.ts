import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { adminDb } from '@/lib/firebase-admin';
import { GoogleGenAI } from '@google/genai';
import { getSession } from '@/lib/auth';
import { REPORT_INSTRUCTION } from '@/lib/ai-config';

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reportJson } = await req.json();
    if (!reportJson) return NextResponse.json({ error: 'Report data required' }, { status: 400 });

    if (!adminDb) {
      throw new Error('Firebase Admin SDK is not properly initialized. Check environment variables.');
    }

    const roomDoc = await adminDb.collection('ideaRooms').doc(roomId).get();
    if (!roomDoc.exists || roomDoc.data()?.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check if report exists
    const reportsSnapshot = await adminDb.collection('reports').where('roomId', '==', roomId).get();
    
    if (!reportsSnapshot.empty) {
        const reportDocId = reportsSnapshot.docs[0].id;
        await adminDb.collection('reports').doc(reportDocId).update({
            summary: JSON.stringify(reportJson),
            score: reportJson.score || 0,
            updatedAt: new Date().toISOString()
        });
    } else {
        const reportId = uuidv4();
        await adminDb.collection('reports').doc(reportId).set({
            reportId,
            roomId,
            userId: session.userId,
            score: reportJson.score || 0,
            summary: JSON.stringify(reportJson),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        const { roomId } = await params;
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!adminDb) {
            throw new Error('Firebase Admin SDK is not properly initialized. Check environment variables.');
        }

        const reportsSnapshot = await adminDb.collection('reports').where('roomId', '==', roomId).get();
        
        if (reportsSnapshot.empty) {
            return NextResponse.json({ success: true, report: null });
        }
        
        const doc = reportsSnapshot.docs[0].data();

        let parsedSummary: any = {};
        try {
          parsedSummary = doc.summary ? JSON.parse(doc.summary) : {};
        } catch {
          // Corrupted summary — return score-only report rather than crashing
          console.error('[report/route] Failed to parse stored report summary for room:', roomId);
        }

        return NextResponse.json({
          success: true,
          report: { score: doc.score ?? 0, ...parsedSummary },
        });
    } catch (err: any) {
        console.error('[report/route] GET error:', err?.message ?? err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
