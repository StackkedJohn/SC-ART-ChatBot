import { ChatInterface } from '@/components/chat/chat-interface';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <ChatInterface />
    </div>
  );
}
