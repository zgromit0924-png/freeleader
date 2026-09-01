import { NextResponse } from 'next/server';
import { loadMemberTaskByToken } from '@/lib/member-task-loader';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const task = await loadMemberTaskByToken(token);
  if (!task) return NextResponse.json({ message: '任务链接无效或已过期。' }, { status: 404 });
  return NextResponse.json({ task });
}
