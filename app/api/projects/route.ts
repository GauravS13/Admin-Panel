/* eslint-disable @typescript-eslint/no-explicit-any */
import { withAuth } from '@/lib/auth/middleware';
import { ActivityLog, Project } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for creating projects
const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  client: z.string().min(1, 'Client is required'),
  assignedTo: z.array(z.string()).min(1, 'At least one team member is required'),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().min(1, 'Category is required').max(50),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  budget: z.number().optional(),
  estimatedHours: z.number().min(0).optional(),
  startDate: z.string().datetime().optional(),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string().max(30)).optional(),
});

// GET /api/projects - List all projects with filtering and pagination
export async function GET(request: NextRequest) {
  const authResult = await withAuth()(request);
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const client = searchParams.get('client');
    const assignedTo = searchParams.get('assignedTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    await connectToDatabase();

    // Build filter object
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (client) filter.client = client;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('client', 'firstName lastName company')
        .populate('assignedTo', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  const authResult = await withAuth()(request);
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Convert date strings to Date objects
    if (validatedData.startDate) {
      validatedData.startDate = new Date(validatedData.startDate).toISOString();
    }
    if (validatedData.deadline) {
      validatedData.deadline = new Date(validatedData.deadline).toISOString();
    }

    await connectToDatabase();

    // Create new project
    const project = new Project({
      ...validatedData,
      createdBy: authResult.user!.userId,
    });

    await project.save();

    // Populate related data
    await project.populate('client', 'firstName lastName company');
    await project.populate('assignedTo', 'firstName lastName email');

    // Log activity
    await (ActivityLog as any).createLog(
      authResult.user!.userId as string,
      'CREATE_PROJECT',
      'project',
      `Created new project: ${project.title}`,
      {
        category: 'project',
        severity: 'medium',
        resourceId: project._id,
        metadata: {
          client: project.client,
          status: project.status,
          priority: project.priority,
          budget: project.budget,
          createdBy: authResult.user!.userId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

