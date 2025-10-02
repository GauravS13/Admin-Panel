'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart3,
    Building,
    FolderOpen,
    LayoutDashboard,
    MessageSquare,
    Shield,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Role-based access control with JWT authentication and secure password hashing.',
    },
    {
      icon: LayoutDashboard,
      title: 'Modern Dashboard',
      description: 'Beautiful analytics dashboard with real-time data visualization and insights.',
    },
    {
      icon: MessageSquare,
      title: 'Inquiry Management',
      description: 'Comprehensive inquiry management with status tracking and automated responses.',
    },
    {
      icon: Building,
      title: 'Client Portal',
      description: 'Complete client management system with project tracking and communication tools.',
    },
    {
      icon: FolderOpen,
      title: 'Project Management',
      description: 'Advanced project management with timeline tracking, milestones, and resource allocation.',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Detailed analytics and customizable reports for business intelligence.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B49AC] via-[#98BDFF] to-[#7DA0FA]">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#4B49AC]" />
          </div>
          <span className="text-xl font-bold text-white">IT Admin</span>
        </div>
        <Button asChild variant="secondary" className="bg-white text-[#4B49AC] hover:bg-gray-100">
          <Link href="/login">Sign In</Link>
        </Button>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Four Eyed Gems
            <span className="block text-[#F3797E]">Admin Panel</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            A comprehensive, modern admin panel built with Next.js, TypeScript, and MongoDB.
            Manage your Four Eyed Gems business with powerful analytics and streamlined workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-[#4B49AC] hover:bg-gray-100 text-lg px-8 py-3">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[#4B49AC] text-lg px-8 py-3">
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/80 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-white/80">Everything you need to manage your Four Eyed Gems business</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-white/80">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/80">Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">50+</div>
              <div className="text-white/80">Integrations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">100%</div>
              <div className="text-white/80">Secure</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white mb-4">
                Ready to Get Started?
              </CardTitle>
              <CardDescription className="text-white/80 text-lg">
                Join thousands of IT consultancies who trust our platform to manage their business operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-[#4B49AC] hover:bg-[#7978E9] text-white">
                  <Link href="/login">Start Free Trial</Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[#4B49AC]">
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 px-6">
        <div className="container mx-auto text-center text-white/60">
          <p>&copy; 2024 Four Eyed Gems. Built with Next.js & TypeScript.</p>
        </div>
      </footer>
    </div>
  );
}
