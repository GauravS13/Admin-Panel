'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  DollarSign,
  Download,
  Filter,
  FolderOpen,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ReportData {
  totalInquiries: number;
  totalClients: number;
  totalProjects: number;
  totalRevenue: number;
  monthlyGrowth: number;
  conversionRate: number;
}

// interface ChartData {
//   name: string;
//   value: number;
//   inquiries?: number;
//   clients?: number;
//   projects?: number;
//   revenue?: number;
// }

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    totalInquiries: 0,
    totalClients: 0,
    totalProjects: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [reportType, setReportType] = useState('overview');

  // Sample data for charts
  const revenueData = [
    { name: 'Jan', revenue: 12000, inquiries: 45, clients: 8 },
    { name: 'Feb', revenue: 15000, inquiries: 52, clients: 12 },
    { name: 'Mar', revenue: 18000, inquiries: 48, clients: 15 },
    { name: 'Apr', revenue: 22000, inquiries: 65, clients: 18 },
    { name: 'May', revenue: 25000, inquiries: 58, clients: 22 },
    { name: 'Jun', revenue: 28000, inquiries: 72, clients: 25 },
  ];

  const inquirySourceData = [
    { name: 'Website', value: 45, color: '#4B49AC' },
    { name: 'Referral', value: 25, color: '#98BDFF' },
    { name: 'Social Media', value: 15, color: '#7DA0FA' },
    { name: 'Cold Outreach', value: 10, color: '#7978E9' },
    { name: 'Conference', value: 5, color: '#F3797E' },
  ];

  const projectStatusData = [
    { name: 'Completed', value: 35, color: '#10B981' },
    { name: 'In Progress', value: 28, color: '#3B82F6' },
    { name: 'On Hold', value: 12, color: '#F59E0B' },
    { name: 'Cancelled', value: 5, color: '#EF4444' },
  ];

  const clientStatusData = [
    { name: 'Active', value: 45, color: '#10B981' },
    { name: 'Prospect', value: 25, color: '#3B82F6' },
    { name: 'Inactive', value: 15, color: '#6B7280' },
    { name: 'Former', value: 15, color: '#EF4444' },
  ];

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from your API based on dateRange and reportType
      // For now, we'll simulate the data
      setReportData({
        totalInquiries: 245,
        totalClients: 67,
        totalProjects: 18,
        totalRevenue: 45600,
        monthlyGrowth: 23,
        conversionRate: 94,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // In a real app, this would generate and download a PDF/Excel report
    console.log('Exporting report...');
    // For now, just show an alert
    alert('Report export functionality would be implemented here');
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
        <Icon className={`h-4 w-4`}/>
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
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive business intelligence and reporting</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" onClick={fetchReportData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Report Filters</CardTitle>
            <CardDescription>Customize your report data and time range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Time Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                    <SelectItem value="6months">Last 6 months</SelectItem>
                    <SelectItem value="1year">Last year</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="revenue">Revenue Analysis</SelectItem>
                    <SelectItem value="clients">Client Analysis</SelectItem>
                    <SelectItem value="projects">Project Analysis</SelectItem>
                    <SelectItem value="inquiries">Inquiry Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <StatCard
            title="Total Inquiries"
            value={reportData.totalInquiries}
            icon={MessageSquare}
            trend="+12%"
            color="#4B49AC"
            description="This month"
          />
          <StatCard
            title="Total Clients"
            value={reportData.totalClients}
            icon={Users}
            trend="+8%"
            color="#98BDFF"
            description="Active clients"
          />
          <StatCard
            title="Total Projects"
            value={reportData.totalProjects}
            icon={FolderOpen}
            trend="+15%"
            color="#7DA0FA"
            description="Ongoing projects"
          />
          <StatCard
            title="Total Revenue"
            value={`$${reportData.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+23%"
            color="#F3797E"
            description="This month"
          />
          <StatCard
            title="Monthly Growth"
            value={`${reportData.monthlyGrowth}%`}
            icon={TrendingUp}
            trend="+5%"
            color="#10B981"
            description="Revenue growth"
          />
          <StatCard
            title="Conversion Rate"
            value={`${reportData.conversionRate}%`}
            icon={BarChart3}
            trend="+2%"
            color="#4B49AC"
            description="Inquiry to client"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue and inquiry trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4B49AC"
                    strokeWidth={3}
                    dot={{ fill: '#4B49AC', strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="inquiries"
                    stroke="#98BDFF"
                    strokeWidth={2}
                    dot={{ fill: '#98BDFF', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inquiry Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Inquiry Sources</CardTitle>
              <CardDescription>Distribution of inquiries by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inquirySourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${(parseInt(value as string) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inquirySourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Project Status</CardTitle>
              <CardDescription>Current distribution of project statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#98BDFF" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Client Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Client Status</CardTitle>
              <CardDescription>Distribution of clients by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={clientStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${(parseInt(value as string) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {clientStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Report */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Executive Summary</CardTitle>
            <CardDescription>Key insights and recommendations based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">📈 Positive Trends</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Revenue has grown by 23% this month compared to last month</li>
                  <li>• Client conversion rate is at 94%, above industry average</li>
                  <li>• Website inquiries are your strongest lead source (45% of total)</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Focus more marketing efforts on website optimization</li>
                  <li>• Consider expanding referral program (currently 25% of inquiries)</li>
                  <li>• Monitor project completion rates to maintain quality</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Areas to Watch</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 12% of projects are on hold - investigate causes</li>
                  <li>• Cold outreach only generates 10% of inquiries - consider strategy review</li>
                  <li>• 15% of clients are inactive - implement re-engagement campaign</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
