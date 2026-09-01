import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MemberTaskClient from '@/components/member-task-client';
import { loadMemberTaskByToken } from '@/lib/member-task-loader';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const memberTask = await loadMemberTaskByToken(token);
  if (!memberTask) return { title: '任务链接无效 · FreeLeader', robots: { index: false, follow: false } };
  return { title: `${memberTask.task.title} · FreeLeader`, description: `${memberTask.memberName}的专属任务、验收标准和提交入口。`, robots: { index: false, follow: false }, openGraph: { images: [] }, twitter: { images: [] } };
}

export default async function MemberTaskPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const memberTask = await loadMemberTaskByToken(token);
  if (!memberTask) notFound();
  return <MemberTaskClient initialTask={memberTask} />;
}
