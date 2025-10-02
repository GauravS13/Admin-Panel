/* eslint-disable @typescript-eslint/no-explicit-any */
import { withAuth } from '@/lib/auth/middleware';
import { ActivityLog, Client } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for updating clients
const updateClientSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
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
  website: z.string().url().optional().or(z.literal('')).optional(),
  industry: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'former']).optional(),
  source: z.enum(['inquiry', 'referral', 'cold_outreach', 'conference', 'social_media', 'other']).optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string().max(30)).optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
  }).optional(),
  lastContact: z.string().datetime().optional(),
  nextFollowUp: z.string().datetime().optional(),
  isArchived: z.boolean().optional(),
});

// Validation schema for adding notes
const addNoteSchema = z.object({
  content: z.string().min(1).max(1000),
});

// GET /api/clients/[id] - Get single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth()(request);
  if (authResult.response) return authResult.response;

  try {
    await connectToDatabase();
    const { id } = await params;

    const client = await Client.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('notes.createdBy', 'firstName lastName email');

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: client,
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth()(request);
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);
    const { id } = await params;

    await connectToDatabase();

    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Convert date strings to Date objects if provided
    if (validatedData.lastContact) {
      validatedData.lastContact = new Date(validatedData.lastContact).toISOString();
    }
    if (validatedData.nextFollowUp) {
      validatedData.nextFollowUp = new Date(validatedData.nextFollowUp).toISOString();
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email.toLowerCase() !== client.email) {
      const existingClient = await Client.findOne({ email: validatedData.email.toLowerCase() });
      if (existingClient) {
        return NextResponse.json(
          { error: 'Email address is already registered' },
          { status: 400 }
        );
      }
      validatedData.email = validatedData.email.toLowerCase();
    }

    // Update client
    Object.assign(client, validatedData);
    await client.save();

    // Populate updated client
    await client.populate('assignedTo', 'firstName lastName email');

    // Log activity
    await (ActivityLog as any).createLog(
      authResult.user!.userId as string,
      'UPDATE_CLIENT',
      'client',
      `Updated client: ${client.firstName} ${client.lastName}`,
      {
        category: 'client',
        severity: 'low',
        resourceId: client._id,
        metadata: {
          updatedFields: Object.keys(validatedData),
          updatedBy: authResult.user!.userId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client updated successfully',
    });

  } catch (error) {
    console.error('Error updating client:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(['super_admin', 'admin'])(request);
  if (authResult.response) return authResult.response;

  try {
    await connectToDatabase();
    const { id } = await params;

    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Log deletion activity
    await (ActivityLog as any).createLog(
      authResult.user!.userId as string,
      'DELETE_CLIENT',
      'client',
      `Deleted client: ${client.firstName} ${client.lastName}`,
      {
        category: 'client',
        severity: 'high',
        resourceId: client._id,
        metadata: {
          clientEmail: client.email,
          clientCompany: client.company,
          deletedBy: authResult.user!.userId,
        },
      }
    );

    await Client.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/notes - Add note to client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth()(request);
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const { content } = addNoteSchema.parse(body);
    const { id } = await params;

    await connectToDatabase();

    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Add new note
    const newNote = {
      content,
      createdBy: authResult.user!.userId,
      createdAt: new Date(),
    };

    client.notes.push(newNote);
    await client.save();

    // Populate the new note's creator
    await client.populate('notes.createdBy', 'firstName lastName email');

    // Log activity
    await (ActivityLog as any).createLog(
      authResult.user!.userId as string,
      'ADD_CLIENT_NOTE',
      'client',
      `Added note to client: ${client.firstName} ${client.lastName}`,
      {
        category: 'client',
        severity: 'low',
        resourceId: client._id,
        metadata: {
          noteContent: content.substring(0, 100),
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: client.notes[client.notes.length - 1],
      message: 'Note added successfully',
    });

  } catch (error) {
    console.error('Error adding note:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}

