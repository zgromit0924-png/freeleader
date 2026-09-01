import ClaimBoardClient from '@/components/claim-board-client';

export const metadata = { title: '任务认领 · FreeLeader', robots: { index: false, follow: false } };

export default function ClaimPage() {
  return <ClaimBoardClient />;
}
