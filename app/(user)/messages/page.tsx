import MessagesPage from '@/components/views/Messages/messages';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'پیام‌ها',
  description: 'گفتگوی شما با شهروندان، همه در یک جا.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MessagesPage />;
}
