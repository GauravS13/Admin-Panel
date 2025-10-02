'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { httpClient } from '@/lib/services/httpClient';
import {
    Activity,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    FileText,
    MessageSquare,
    TrendingUp,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalClients: number;
    totalInquiries: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    monthlyRevenue: number;
    growthRate: number;
  };
  userStats: {
    newUsers: number;
    activeUsers: number;
    userGrowth: number;
  };
  clientStats: {
    newClients: number;
    activeClients: number;
    clientGrowth: number;
  };
  inquiryStats: {
    totalInquiries: number;
    newInquiries: number;
    respondedInquiries: number;
    conversionRate: number;
  };
  projectStats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onTimeDelivery: number;
  };
  revenueData: Array<{
    month: string;
    revenue: number;
    projects: number;
  }>;
  userActivityData: Array<{
    date: string;
    users: number;
    sessions: number;
  }>;
  projectStatusData: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  inquirySourceData: Array<{
    source: string;
    count: number;
    color: string;
  }>;
}

const COLORS = ['#4B49AC', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
    
    // Fallback timeout to ensure loading doesn't get stuck
    const timeout = setTimeout(() => {
      console.log('Timeout reached, using mock data');
      setAnalyticsData(mockData);
      setLoading(false);
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('Fetching analytics data...');
      
      const response = await httpClient.get(`/api/analytics?period=${selectedPeriod}`);
      console.log('Analytics API response:', response);
      
      if (response.success && response.data) {
        console.log('Setting analytics data from API');
        setAnalyticsData(response.data);
      } else {
        console.error('Failed to fetch analytics data:', response.error);
        console.log('Using mock data instead');
        setAnalyticsData(mockData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      console.log('Using mock data due to error');
      setAnalyticsData(mockData);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  // Mock data for demonstration (replace with real API calls)
  const mockData: AnalyticsData = {
    overview: {
      totalUsers: 45,
      totalClients: 128,
      totalInquiries: 89,
      totalProjects: 67,
      activeProjects: 23,
      completedProjects: 44,
      monthlyRevenue: 125000,
      growthRate: 12.5
    },
    userStats: {
      newUsers: 8,
      activeUsers: 42,
      userGrowth: 15.2
    },
    clientStats: {
      newClients: 12,
      activeClients: 98,
      clientGrowth: 8.7
    },
    inquiryStats: {
      totalInquiries: 89,
      newInquiries: 15,
      respondedInquiries: 78,
      conversionRate: 24.7
    },
    projectStats: {
      totalProjects: 67,
      activeProjects: 23,
      completedProjects: 44,
      onTimeDelivery: 89.2
    },
    revenueData: [
      { month: 'Jan', revenue: 85000, projects: 12 },
      { month: 'Feb', revenue: 92000, projects: 15 },
      { month: 'Mar', revenue: 78000, projects: 11 },
      { month: 'Apr', revenue: 105000, projects: 18 },
      { month: 'May', revenue: 118000, projects: 22 },
      { month: 'Jun', revenue: 125000, projects: 25 }
    ],
    userActivityData: [
      { date: '2024-01-01', users: 25, sessions: 45 },
      { date: '2024-01-02', users: 28, sessions: 52 },
      { date: '2024-01-03', users: 32, sessions: 61 },
      { date: '2024-01-04', users: 29, sessions: 48 },
      { date: '2024-01-05', users: 35, sessions: 67 },
      { date: '2024-01-06', users: 38, sessions: 72 },
      { date: '2024-01-07', users: 42, sessions: 78 }
    ],
    projectStatusData: [
      { status: 'Active', count: 23, color: '#4B49AC' },
      { status: 'Completed', count: 44, color: '#10B981' },
      { status: 'On Hold', count: 8, color: '#F59E0B' },
      { status: 'Cancelled', count: 2, color: '#EF4444' }
    ],
    inquirySourceData: [
      { source: 'Website', count: 35, color: '#4B49AC' },
      { source: 'Referral', count: 28, color: '#8B5CF6' },
      { source: 'Social Media', count: 15, color: '#06B6D4' },
      { source: 'Email', count: 11, color: '#10B981' }
    ]
  };

  const data = analyticsData || mockData;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#4B49AC] mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Analytics...</h2>
          <p className="text-gray-600">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  // Ensure data is available before rendering
  if (!data || !data.overview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Data Available</h2>
          <p className="text-gray-600">Unable to load analytics data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B49AC] focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +{data.userStats?.userGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +{data.clientStats?.clientGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview?.activeProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview?.completedProjects || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(data.overview?.monthlyRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +{data.overview?.growthRate || 0}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue and project count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.revenueData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4B49AC" 
                      fill="#4B49AC" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Daily active users and sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.userActivityData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#4B49AC" strokeWidth={2} />
                    <Line type="monotone" dataKey="sessions" stroke="#8B5CF6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Project Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
                <CardDescription>Current status of all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.projectStatusData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(data.projectStatusData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inquiry Sources</CardTitle>
                <CardDescription>Where inquiries are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.inquirySourceData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4B49AC" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${(data.overview?.monthlyRevenue || 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  +{data.overview?.growthRate || 0}% growth
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Project Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${Math.round((data.overview?.monthlyRevenue || 0) / (data.overview?.totalProjects || 1)).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-2">Per project</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue per Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${Math.round((data.overview?.monthlyRevenue || 0) / (data.overview?.totalClients || 1)).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-2">Per client</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Detailed revenue analysis by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.revenueData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#4B49AC" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.projectStats?.totalProjects || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{data.projectStats?.activeProjects || 0}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.projectStats?.completedProjects || 0}</div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.projectStats?.onTimeDelivery || 0}%</div>
                <p className="text-xs text-muted-foreground">Delivery rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>Project completion over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.revenueData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="projects" stroke="#4B49AC" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inquiries Tab */}
        <TabsContent value="inquiries" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.inquiryStats?.totalInquiries || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{data.inquiryStats?.newInquiries || 0}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Responded</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.inquiryStats?.respondedInquiries || 0}</div>
                <p className="text-xs text-muted-foreground">Response rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.inquiryStats?.conversionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Inquiry to client</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inquiry Sources</CardTitle>
              <CardDescription>Where your inquiries are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.inquirySourceData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(data.inquirySourceData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  {(data.inquirySourceData || []).map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="text-sm font-medium">{source.source}</span>
                      </div>
                      <span className="text-sm text-gray-600">{source.count} inquiries</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
