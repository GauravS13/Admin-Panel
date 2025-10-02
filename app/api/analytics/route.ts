import { authenticateRequest } from '@/lib/auth/middleware';
import { Client, Inquiry, Project, User } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Analytics API called');
    const authResult = await authenticateRequest(request);
    
    if (authResult.response) {
      console.log('Authentication failed:', authResult.response);
      return authResult.response;
    }

    if (!authResult.user) {
      console.log('No user found in auth result');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', authResult.user.email);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully');

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get overview statistics
    console.log('Fetching overview statistics...');
    const [
      totalUsers,
      totalClients,
      totalInquiries,
      totalProjects,
      activeProjects,
      completedProjects,
      newUsers,
      newClients,
      newInquiries,
      respondedInquiries
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Client.countDocuments(),
      Inquiry.countDocuments(),
      Project.countDocuments(),
      Project.countDocuments({ status: 'active' }),
      Project.countDocuments({ status: 'completed' }),
      User.countDocuments({ 
        isActive: true, 
        createdAt: { $gte: startDate } 
      }),
      Client.countDocuments({ 
        createdAt: { $gte: startDate } 
      }),
      Inquiry.countDocuments({ 
        createdAt: { $gte: startDate } 
      }),
      Inquiry.countDocuments({ 
        status: 'responded',
        updatedAt: { $gte: startDate }
      })
    ]);

    console.log('Overview statistics fetched:', {
      totalUsers,
      totalClients,
      totalInquiries,
      totalProjects,
      activeProjects,
      completedProjects
    });

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate);
    const previousPeriodEnd = new Date(startDate);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() + (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const [
      previousUsers,
      previousClients,
      previousInquiries
    ] = await Promise.all([
      User.countDocuments({ 
        isActive: true, 
        createdAt: { 
          $gte: new Date(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime())),
          $lt: startDate
        } 
      }),
      Client.countDocuments({ 
        createdAt: { 
          $gte: new Date(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime())),
          $lt: startDate
        } 
      }),
      Inquiry.countDocuments({ 
        createdAt: { 
          $gte: new Date(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime())),
          $lt: startDate
        } 
      })
    ]);

    const userGrowth = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0;
    const clientGrowth = previousClients > 0 ? ((newClients - previousClients) / previousClients) * 100 : 0;
    const inquiryGrowth = previousInquiries > 0 ? ((newInquiries - previousInquiries) / previousInquiries) * 100 : 0;

    // Get revenue data (mock for now - replace with actual revenue calculation)
    const monthlyRevenue = 125000; // This should be calculated from actual project data
    const growthRate = 12.5; // This should be calculated from historical data

    // Get project status distribution
    const projectStatusData = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get inquiry source distribution
    const inquirySourceData = await Inquiry.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    // Generate revenue data for charts (mock data - replace with real calculation)
    const revenueData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    for (let i = 0; i < 6; i++) {
      revenueData.push({
        month: months[i],
        revenue: Math.floor(Math.random() * 50000) + 75000,
        projects: Math.floor(Math.random() * 15) + 10
      });
    }

    // Generate user activity data (mock data - replace with real analytics)
    const userActivityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      userActivityData.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 20) + 20,
        sessions: Math.floor(Math.random() * 40) + 40
      });
    }

    // Calculate conversion rate
    const conversionRate = totalInquiries > 0 ? (totalClients / totalInquiries) * 100 : 0;

    // Calculate on-time delivery rate
    const onTimeProjects = await Project.countDocuments({ 
      status: 'completed',
      completedAt: { $lte: '$dueDate' }
    });
    const onTimeDelivery = completedProjects > 0 ? (onTimeProjects / completedProjects) * 100 : 0;

    const analyticsData = {
      overview: {
        totalUsers,
        totalClients,
        totalInquiries,
        totalProjects,
        activeProjects,
        completedProjects,
        monthlyRevenue,
        growthRate
      },
      userStats: {
        newUsers,
        activeUsers: totalUsers,
        userGrowth: Math.round(userGrowth * 10) / 10
      },
      clientStats: {
        newClients,
        activeClients: totalClients,
        clientGrowth: Math.round(clientGrowth * 10) / 10
      },
      inquiryStats: {
        totalInquiries,
        newInquiries,
        respondedInquiries,
        conversionRate: Math.round(conversionRate * 10) / 10
      },
      projectStats: {
        totalProjects,
        activeProjects,
        completedProjects,
        onTimeDelivery: Math.round(onTimeDelivery * 10) / 10
      },
      revenueData,
      userActivityData,
      projectStatusData: projectStatusData.map(item => ({
        status: item._id,
        count: item.count,
        color: getStatusColor(item._id)
      })),
      inquirySourceData: inquirySourceData.map(item => ({
        source: item._id || 'Unknown',
        count: item.count,
        color: getSourceColor(item._id)
      }))
    };

    console.log('Analytics data prepared, sending response');
    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    'active': '#4B49AC',
    'completed': '#10B981',
    'on_hold': '#F59E0B',
    'cancelled': '#EF4444',
    'pending': '#6B7280'
  };
  return colors[status] || '#6B7280';
}

function getSourceColor(source: string): string {
  const colors: { [key: string]: string } = {
    'website': '#4B49AC',
    'referral': '#8B5CF6',
    'social_media': '#06B6D4',
    'email': '#10B981',
    'phone': '#F59E0B',
    'other': '#6B7280'
  };
  return colors[source] || '#6B7280';
}
