import { ChatInterface } from '@/components/chat/chat-interface';
import { WelcomeModalWrapper } from '@/components/intern/welcome-modal-wrapper';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <>
      <WelcomeModalWrapper user={user} />
      <div className="h-[calc(100vh-3.5rem)]">
        <ChatInterface />
      </div>
    </>
  );
}
