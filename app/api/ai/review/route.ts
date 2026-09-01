import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { reviewWithOptionalModel } from '@/lib/review-engine';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: '请先登录组长账号。' }, { status: 401 });
  const body = await request.json() as { content?: string; criteria?: string[]; duplicateFile?: boolean };
  if (!body.content?.trim()) return NextResponse.json({ message: '缺少待预审正文。' }, { status: 400 });
  const review = await reviewWithOptionalModel(body.content, body.criteria ?? [], Boolean(body.duplicateFile));
  return NextResponse.json({ review });
}
