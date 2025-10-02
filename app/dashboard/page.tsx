'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import AdminLayout from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart3,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    FolderOpen,
    MessageSquare,
    TrendingUp,
    Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DashboardStats {
  totalInquiries: number;
  unreadInquiries: number;
  activeClients: number;
  ongoingProjects: number;
  pendingTasks: number;
  monthlyRevenue: number;
}

// interface ChartData {
//   name: string;
//   value: number;
//   inquiries?: number;
//   clients?: number;
//   projects?: number;
// }

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalInquiries: 0,
    unreadInquiries: 0,
    activeClients: 0,
    ongoingProjects: 0,
    pendingTasks: 0,
    monthlyRevenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<unknown[]>([]);

  // Sample data for charts
  const inquiryTrendData = [
    { name: 'Jan', value: 65, inquiries: 65 },
    { name: 'Feb', value: 78, inquiries: 78 },
    { name: 'Mar', value: 90, inquiries: 90 },
    { name: 'Apr', value: 81, inquiries: 81 },
    { name: 'May', value: 95, inquiries: 95 },
    { name: 'Jun', value: 110, inquiries: 110 },
  ];

  const statusData = [
    { name: 'Unread', value: 25, color: '#F3797E' },
    { name: 'In Progress', value: 45, color: '#98BDFF' },
    { name: 'Resolved', value: 30, color: '#7DA0FA' },
  ];

  const projectData = [
    { name: 'Web Dev', value: 12, projects: 12 },
    { name: 'Mobile', value: 8, projects: 8 },
    { name: 'Consulting', value: 15, projects: 15 },
    { name: 'Maintenance', value: 6, projects: 6 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll simulate the data
      setStats({
        totalInquiries: 245,
        unreadInquiries: 23,
        activeClients: 67,
        ongoingProjects: 18,
        pendingTasks: 12,
        monthlyRevenue: 45600,
      });

      setRecentActivity([
        {
          id: 1,
          type: 'inquiry',
          message: 'New inquiry from John Doe',
          time: '2 minutes ago',
          status: 'unread',
        },
        {
          id: 2,
          type: 'project',
          message: 'Project "E-commerce Platform" completed',
          time: '1 hour ago',
          status: 'completed',
        },
        {
          id: 3,
          type: 'client',
          message: 'New client "TechCorp Inc." added',
          time: '3 hours ago',
          status: 'new',
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color,
    description
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    color: string;
    description?: string;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4`}  />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        {trend && (
          <p className="text-xs text-gray-600 mt-1">
            <span className="text-green-600 font-medium">{trend}</span> from last month
          </p>
        )}
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B49AC]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening with your business.</p>
          </div>
          <Button 
            className="bg-[#4B49AC] hover:bg-[#7978E9]"
            onClick={() => router.push('/reports')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <StatCard
            title="Total Inquiries"
            value={stats.totalInquiries}
            icon={MessageSquare}
            trend="+12%"
            color="#4B49AC"
            description={`${stats.unreadInquiries} unread`}
          />
          <StatCard
            title="Active Clients"
            value={stats.activeClients}
            icon={Users}
            trend="+8%"
            color="#98BDFF"
          />
          <StatCard
            title="Ongoing Projects"
            value={stats.ongoingProjects}
            icon={FolderOpen}
            trend="+15%"
            color="#7DA0FA"
          />
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={Clock}
            color="#7978E9"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue.toLocaleString()}`}
            icon={TrendingUp}
            trend="+23%"
            color="#F3797E"
          />
          <StatCard
            title="Success Rate"
            value="94%"
            icon={CheckCircle}
            trend="+5%"
            color="#4B49AC"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inquiry Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Inquiry Trends</CardTitle>
              <CardDescription>Monthly inquiry volume over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={inquiryTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="inquiries"
                    stroke="#4B49AC"
                    strokeWidth={3}
                    dot={{ fill: '#4B49AC', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inquiry Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Inquiry Status</CardTitle>
              <CardDescription>Current distribution of inquiry statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${(value ? value as number * 100 : 0).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Project Categories & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Project Categories</CardTitle>
              <CardDescription>Distribution of projects by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="projects" fill="#98BDFF" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest updates from your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'unread' ? 'bg-red-500' :
                      activity.status === 'completed' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <Badge
                      variant={
                        activity.status === 'unread' ? 'destructive' :
                        activity.status === 'completed' ? 'default' :
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Calendar className="w-4 h-4 mr-2" />
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-[#4B49AC] hover:text-white transition-colors"
                onClick={() => router.push('/inquiries')}
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-sm">New Inquiry</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-[#4B49AC] hover:text-white transition-colors"
                onClick={() => router.push('/clients')}
              >
                <Building className="w-6 h-6" />
                <span className="text-sm">Add Client</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-[#4B49AC] hover:text-white transition-colors"
                onClick={() => router.push('/projects')}
              >
                <FolderOpen className="w-6 h-6" />
                <span className="text-sm">New Project</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-[#4B49AC] hover:text-white transition-colors"
                onClick={() => router.push('/users')}
              >
                <Users className="w-6 h-6" />
                <span className="text-sm">Add User</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

