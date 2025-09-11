import { withAuth } from '@/lib/auth/middleware';
import { ActivityLog, Inquiry } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for updating inquiries
const updateInquirySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(2000).optional(),
  status: z.enum(['unread', 'read', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().min(1).max(50).optional(),
  assignedTo: z.string().optional(), // ObjectId as string
  tags: z.array(z.string().max(30)).optional(),
  isArchived: z.boolean().optional(),
});

// Validation schema for adding notes
const addNoteSchema = z.object({
  content: z.string().min(1).max(1000),
});

// GET /api/inquiries/[id] - Get single inquiry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const inquiry = await Inquiry.findById(params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('notes.createdBy', 'firstName lastName email');

    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inquiry,
    });

  } catch (error) {
    console.error('Error fetching inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiry' },
      { status: 500 }
    );
  }
}

// PUT /api/inquiries/[id] - Update inquiry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await withAuth()(request);
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const validatedData = updateInquirySchema.parse(body);

    await connectToDatabase();

    const inquiry = await Inquiry.findById(params.id);
    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Track status changes for activity logging
    const oldStatus = inquiry.status;
    const newStatus = validatedData.status || oldStatus;

    // Update inquiry
    Object.assign(inquiry, validatedData);
    await inquiry.save();

    // Populate updated inquiry
    await inquiry.populate('assignedTo', 'firstName lastName email');

    // Log activity if status changed
    if (oldStatus !== newStatus) {
      await ActivityLog.createLog(
        authResult.user!.userId as any,
        'UPDATE_INQUIRY_STATUS',
        'inquiry',
        `Changed inquiry status from ${oldStatus} to ${newStatus}`,
        {
          category: 'inquiry',
          severity: 'low',
          resourceId: inquiry._id,
          metadata: {
            oldStatus,
            newStatus,
            inquiryId: inquiry._id,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: 'Inquiry updated successfully',
    });

  } catch (error) {
    console.error('Error updating inquiry:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update inquiry' },
      { status: 500 }
    );
  }
}

// DELETE /api/inquiries/[id] - Delete inquiry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await withAuth(['super_admin', 'admin'])(request);
  if (authResult.response) return authResult.response;

  try {
    await connectToDatabase();

    const inquiry = await Inquiry.findById(params.id);
    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Log deletion activity
    await ActivityLog.createLog(
      authResult.user!.userId as any,
      'DELETE_INQUIRY',
      'inquiry',
      `Deleted inquiry: ${inquiry.subject}`,
      {
        category: 'inquiry',
        severity: 'high',
        resourceId: inquiry._id,
        metadata: {
          inquirySubject: inquiry.subject,
          inquiryEmail: inquiry.email,
        },
      }
    );

    await Inquiry.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Inquiry deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to delete inquiry' },
      { status: 500 }
    );
  }
}

// POST /api/inquiries/[id]/notes - Add note to inquiry
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await withAuth()(request);
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const { content } = addNoteSchema.parse(body);

    await connectToDatabase();

    const inquiry = await Inquiry.findById(params.id);
    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Add new note
    const newNote = {
      content,
      createdBy: authResult.user!.userId,
      createdAt: new Date(),
    };

    inquiry.notes.push(newNote);
    await inquiry.save();

    // Populate the new note's creator
    await inquiry.populate('notes.createdBy', 'firstName lastName email');

    // Log activity
    await ActivityLog.createLog(
      authResult.user!.userId as any,
      'ADD_INQUIRY_NOTE',
      'inquiry',
      `Added note to inquiry: ${inquiry.subject}`,
      {
        category: 'inquiry',
        severity: 'low',
        resourceId: inquiry._id,
        metadata: {
          noteContent: content.substring(0, 100),
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: inquiry.notes[inquiry.notes.length - 1],
      message: 'Note added successfully',
    });

  } catch (error) {
    console.error('Error adding note:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}

