import { Inquiry } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for creating inquiries
const createInquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(2000),
  category: z.string().min(1, 'Category is required').max(50),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  source: z.enum(['website', 'email', 'phone', 'referral', 'social_media', 'other']).default('website'),
});

// GET /api/inquiries - List all inquiries with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    await connectToDatabase();

    // Build filter object
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .populate('assignedTo', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        inquiries,
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
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}

// POST /api/inquiries - Create new inquiry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createInquirySchema.parse(body);

    await connectToDatabase();

    // Create inquiry
    const inquiry = new Inquiry({
      ...validatedData,
      status: 'unread',
    });

    await inquiry.save();

    // Populate assigned user if any
    await inquiry.populate('assignedTo', 'firstName lastName email');

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: 'Inquiry created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating inquiry:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    );
  }
}

