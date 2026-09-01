import DashboardClient from '@/components/dashboard-client';
import { requireChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireChatGPTUser('/dashboard');
  return <DashboardClient leaderName={user.fullName ?? '张家瑜'} />;
}
