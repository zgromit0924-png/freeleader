import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'http://localhost:3000'),
  title: 'FreeLeader · 小组作业协作工作台',
  description: '把模糊任务变成清晰分工，用客观标准预审提交，并把多人内容整合成可交付成果。',
  openGraph: {
    title: 'FreeLeader · 让小组协作少一点内耗',
    description: '清晰分工、客观预审、冲突决策和多人内容整合。',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'FreeLeader 小组协作工作台' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreeLeader · 让小组协作少一点内耗',
    description: '清晰分工、客观预审、冲突决策和多人内容整合。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
