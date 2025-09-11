'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Edit,
    Eye,
    Filter,
    MessageSquare,
    Plus,
    Search,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  source: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tags: string[];
  notes: Array<{
    content: string;
    createdBy: {
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    page: 1,
    limit: 10,
  });

  // Dialog states
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
  });

  useEffect(() => {
    fetchInquiries();
  }, [filters]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        // Skip "all" values and empty strings when building query params
        if (value && value !== 'all') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/inquiries?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setInquiries(data.data.inquiries);
        setPagination(data.data.pagination);
      } else {
        toast.error(data.error || 'Failed to fetch inquiries');
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" values to empty strings for filtering
    const filterValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setViewDialogOpen(true);
  };

  const handleEditInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setEditForm({
      status: inquiry.status,
      priority: inquiry.priority,
      category: inquiry.category,
      assignedTo: inquiry.assignedTo?._id || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return;

    try {
      const response = await fetch(`/api/inquiries/${selectedInquiry._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Inquiry updated successfully');
        setEditDialogOpen(false);
        fetchInquiries();
      } else {
        toast.error(data.error || 'Failed to update inquiry');
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
      toast.error('Failed to update inquiry');
    }
  };

  const handleAddNote = async () => {
    if (!selectedInquiry || !newNote.trim()) return;

    try {
      const response = await fetch(`/api/inquiries/${selectedInquiry._id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content: newNote }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Note added successfully');
        setNoteDialogOpen(false);
        setNewNote('');
        fetchInquiries();
      } else {
        toast.error(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Inquiry deleted successfully');
        fetchInquiries();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete inquiry');
      }
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      toast.error('Failed to delete inquiry');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800';
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread': return <AlertCircle className="w-4 h-4" />;
      case 'read': return <Eye className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inquiries</h1>
            <p className="text-gray-600 mt-1">Manage and respond to customer inquiries</p>
          </div>
          <Button className="bg-[#4B49AC] hover:bg-[#7978E9]">
            <Plus className="w-4 h-4 mr-2" />
            New Inquiry
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search inquiries..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => setFilters({
                search: '',
                status: 'all',
                priority: 'all',
                category: 'all',
                page: 1,
                limit: 10,
              })}>
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inquiries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Inquiries ({pagination?.totalItems || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B49AC]"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inquiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map((inquiry) => (
                      <TableRow key={inquiry._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{inquiry.name}</div>
                            <div className="text-sm text-gray-500">{inquiry.email}</div>
                            <div className="text-sm text-gray-600 truncate max-w-xs">
                              {inquiry.subject}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(inquiry.status)}>
                            {getStatusIcon(inquiry.status)}
                            <span className="ml-1 capitalize">{inquiry.status.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(inquiry.priority)}>
                            {inquiry.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{inquiry.category}</TableCell>
                        <TableCell>
                          {inquiry.assignedTo ? (
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {inquiry.assignedTo.firstName[0]}{inquiry.assignedTo.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {inquiry.assignedTo.firstName} {inquiry.assignedTo.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInquiry(inquiry)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditInquiry(inquiry)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInquiry(inquiry);
                                setNoteDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInquiry(inquiry._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                      {pagination.totalItems} inquiries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* View Inquiry Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Inquiry Details</DialogTitle>
              <DialogDescription>
                View complete inquiry information and conversation history
              </DialogDescription>
            </DialogHeader>

            {selectedInquiry && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Contact Information</Label>
                    <div className="mt-2 space-y-2">
                      <p><strong>Name:</strong> {selectedInquiry.name}</p>
                      <p><strong>Email:</strong> {selectedInquiry.email}</p>
                      {selectedInquiry.phone && <p><strong>Phone:</strong> {selectedInquiry.phone}</p>}
                      {selectedInquiry.company && <p><strong>Company:</strong> {selectedInquiry.company}</p>}
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold">Inquiry Details</Label>
                    <div className="mt-2 space-y-2">
                      <p><strong>Subject:</strong> {selectedInquiry.subject}</p>
                      <p><strong>Category:</strong> {selectedInquiry.category}</p>
                      <p><strong>Source:</strong> {selectedInquiry.source}</p>
                      <p><strong>Created:</strong> {new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Message</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedInquiry.message}</p>
                  </div>
                </div>

                {selectedInquiry.notes.length > 0 && (
                  <div>
                    <Label className="font-semibold">Notes ({selectedInquiry.notes.length})</Label>
                    <div className="mt-2 space-y-3">
                      {selectedInquiry.notes.map((note, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {note.createdBy.firstName} {note.createdBy.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(selectedInquiry.status)}>
                      {selectedInquiry.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(selectedInquiry.priority)}>
                      {selectedInquiry.priority}
                    </Badge>
                  </div>

                  <Button onClick={() => {
                    setViewDialogOpen(false);
                    setSelectedInquiry(selectedInquiry);
                    setNoteDialogOpen(true);
                  }}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Inquiry Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Inquiry</DialogTitle>
              <DialogDescription>
                Update inquiry status, priority, and assignment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={editForm.priority} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateInquiry}>
                Update Inquiry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Note Dialog */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                Add a note to track progress on this inquiry
              </DialogDescription>
            </DialogHeader>

            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter your note here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                Add Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

