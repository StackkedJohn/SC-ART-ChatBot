import { getCurrentUser, listUsers } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserManagement } from '@/components/admin/user-management';

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'admin') {
    redirect('/');
  }

  const users = await listUsers();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600 mt-2">
          Invite new users and manage existing user roles and access
        </p>
      </div>

      <UserManagement users={users} />
    </div>
  );
}
