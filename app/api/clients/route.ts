import { withAuth } from '@/lib/auth/middleware';
import { ActivityLog, Client } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for creating clients
const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  address: z.object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zipCode: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
  }).optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  industry: z.string().max(100).optional(),
  source: z.enum(['inquiry', 'referral', 'cold_outreach', 'conference', 'social_media', 'other']).default('inquiry'),
  assignedTo: z.string().optional(), // ObjectId as string
  tags: z.array(z.string().max(30)).optional(),
});

// GET /api/clients - List all clients with filtering and pagination
export async function GET(request: NextRequest) {
  const authResult = await withAuth()(request);
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const industry = searchParams.get('industry');
    const assignedTo = searchParams.get('assignedTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    await connectToDatabase();

    // Build filter object
    const filter: any = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (industry) filter.industry = { $regex: industry, $options: 'i' };
    if (assignedTo) filter.assignedTo = assignedTo;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [clients, total] = await Promise.all([
      Client.find(filter)
        .populate('assignedTo', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        clients,
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
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  const authResult = await withAuth()(request);
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    await connectToDatabase();

    // Check if email already exists
    const existingClient = await Client.findOne({ email: validatedData.email.toLowerCase() });
    if (existingClient) {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 400 }
      );
    }

    // Create new client
    const client = new Client({
      ...validatedData,
      email: validatedData.email.toLowerCase(),
    });

    await client.save();

    // Populate assigned user if any
    await client.populate('assignedTo', 'firstName lastName email');

    // Log activity
    await ActivityLog.createLog(
      authResult.user!.userId as any,
      'CREATE_CLIENT',
      'client',
      `Created new client: ${client.firstName} ${client.lastName}`,
      {
        category: 'client',
        severity: 'medium',
        resourceId: client._id,
        metadata: {
          company: client.company,
          industry: client.industry,
          source: client.source,
          createdBy: authResult.user!.userId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating client:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

