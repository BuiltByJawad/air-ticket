import type { Metadata } from 'next';
import { getAgencyDetail } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';
import { Building2, Users, BookOpen, DollarSign, ArrowLeft, Mail } from 'lucide-react';

export const metadata: Metadata = { title: 'Agency Details', description: 'View agency details, agents, and performance.' };
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const AGENT_LIMIT = 20;

export default async function AgencyDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await getSessionToken();
  if (!token) return null;

  const { id } = await params;
  const sp = await searchParams;
  const agentOffset = Number(sp.agentOffset) || 0;

  const agency = await getAgencyDetail(token, id, AGENT_LIMIT, agentOffset).catch((err) => {
    console.error('Failed to fetch agency detail:', err);
    return null;
  });

  if (!agency) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/agencies" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{agency.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{agency.id}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agency.agentsTotal}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agency.bookingsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agency.revenueCurrency} {agency.confirmedRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1">From confirmed bookings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agency.agents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No agents in this agency yet.</p>
          ) : (
            <div className="space-y-3">
              {agency.agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{agent.name || agent.email}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">Agent</Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(agent.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <PaginationControls
            basePath={`/admin/agencies/${id}`}
            meta={{ total: agency.agentsTotal, limit: AGENT_LIMIT, offset: agentOffset }}
            offsetKey="agentOffset"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Created</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {new Date(agency.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
