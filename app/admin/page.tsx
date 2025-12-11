import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderTree, FileText, GraduationCap, Upload, Users, ClipboardList } from 'lucide-react';

const adminSections = [
  {
    title: 'Users',
    description: 'Invite users and manage roles and permissions',
    icon: Users,
    href: '/admin/users',
  },
  {
    title: 'Onboarding',
    description: 'Configure intern onboarding checklist and requirements',
    icon: ClipboardList,
    href: '/admin/onboarding',
  },
  {
    title: 'Categories',
    description: 'Manage top-level content organization',
    icon: FolderTree,
    href: '/admin/categories',
  },
  {
    title: 'Content',
    description: 'Create and edit knowledge base content',
    icon: FileText,
    href: '/admin/content',
  },
  {
    title: 'Quizzes',
    description: 'Create and manage training quizzes',
    icon: GraduationCap,
    href: '/admin/quizzes',
  },
  {
    title: 'Documents',
    description: 'Upload and process PDF, DOCX, and MD files',
    icon: Upload,
    href: '/admin/documents',
  },
];

export default function AdminDashboard() {
  return (
    <div className="container py-8 space-y-8">
      <div className="pb-4 border-b border-brand-cream-slush/30">
        <h1 className="text-4xl font-sans font-extrabold text-brand-sc-pink">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your knowledge base content, quizzes, and documents
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:bg-brand-barely-butter/50 hover:border-brand-sc-pink/30 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-brand-sc-pink/10 p-3 border-2 border-brand-sc-pink/20">
                      <Icon className="h-6 w-6 text-brand-sc-pink" />
                    </div>
                    <div>
                      <CardTitle className="text-brand-sc-pink">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Manage {section.title}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
