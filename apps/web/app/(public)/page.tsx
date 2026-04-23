import type { Metadata } from 'next';
import Link from 'next/link';
import { Plane, Shield, BarChart3, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Air Ticketing', description: 'B2B air ticketing platform for travel agencies.' };

export default async function PublicHomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-2 text-blue-200">
              <Plane className="h-6 w-6" />
              <span className="text-sm font-medium uppercase tracking-wider">AirTicket Platform</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-6xl">
              B2B Air Ticketing<br />Made Simple
            </h1>
            <p className="mt-6 text-lg text-blue-100 leading-relaxed">
              Search, quote, and book flights for your customers from one platform.
              Built for travel agencies who need speed, reliability, and compliance.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Everything your agency needs</h2>
            <p className="mt-4 text-muted-foreground text-lg">Streamlined operations from search to settlement.</p>
          </div>
          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Plane className="h-6 w-6" />}
              title="Flight Search"
              description="Search thousands of routes in real-time. Get instant pricing and availability for your customers."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Secure Booking"
              description="Role-based access, audit logging, and encrypted transactions keep your agency compliant."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Dashboard Analytics"
              description="Track bookings, revenue, and agent performance from a single intuitive dashboard."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="mt-2 text-muted-foreground">Sign in to your agency account to start booking.</p>
          <div className="mt-6">
            <Link href="/login">
              <Button size="lg">
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            <span>AirTicket</span>
          </div>
          <p>B2B Air Ticketing Platform</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
