import type { Metadata } from 'next';
import { LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Logout', description: 'Sign out of your account.' };
import { logoutAction } from './actions';

export default async function LogoutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>Are you sure you want to sign out?</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logoutAction}>
            <Button type="submit" variant="destructive" className="w-full">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
