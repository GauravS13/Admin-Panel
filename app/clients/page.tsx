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
  Building,
  Edit,
  Filter,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  website?: string;
  industry?: string;
  status: 'active' | 'inactive' | 'prospect' | 'former';
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
  totalProjects: number;
  totalRevenue: number;
  lastContact?: string;
  nextFollowUp?: string;
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    industry: '',
    assignedTo: '',
    page: 1,
    limit: 10,
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newNote, setNewNote] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    website: '',
    industry: '',
    status: 'prospect' as 'active' | 'inactive' | 'prospect' | 'former',
    source: 'inquiry' as 'inquiry' | 'referral' | 'cold_outreach' | 'conference' | 'social_media' | 'other',
    assignedTo: '',
    tags: [] as string[],
  });

  useEffect(() => {
    fetchClients();
  }, [filters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        // Skip "all" values and empty strings when building query params
        if (value && value !== 'all') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/clients?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setClients(data.data.clients);
        setPagination(data.data.pagination);
      } else {
        toast.error(data.error || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
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

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      website: '',
      industry: '',
      status: 'prospect',
      source: 'inquiry',
      assignedTo: '',
      tags: [],
    });
  };

  const handleCreateClient = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone || '',
      company: client.company || '',
      position: client.position || '',
      address: {
        street: client.address?.street || '',
        city: client.address?.city || '',
        state: client.address?.state || '',
        zipCode: client.address?.zipCode || '',
        country: client.address?.country || '',
      },
      website: client.website || '',
      industry: client.industry || '',
      status: client.status,
      source: client.source as any,
      assignedTo: client.assignedTo?._id || '',
      tags: client.tags || [],
    });
    setEditDialogOpen(true);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setViewDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      // Clean empty address fields
      const cleanAddress = Object.fromEntries(
        Object.entries(formData.address).filter(([_, value]) => value.trim() !== '')
      );

      const submitData = {
        ...formData,
        address: Object.keys(cleanAddress).length > 0 ? cleanAddress : undefined,
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Client created successfully');
        setCreateDialogOpen(false);
        resetForm();
        fetchClients();
      } else {
        toast.error(data.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedClient) return;

    try {
      // Clean empty address fields
      const cleanAddress = Object.fromEntries(
        Object.entries(formData.address).filter(([_, value]) => value.trim() !== '')
      );

      const updateData = {
        ...formData,
        address: Object.keys(cleanAddress).length > 0 ? cleanAddress : undefined,
      };

      const response = await fetch(`/api/clients/${selectedClient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Client updated successfully');
        setEditDialogOpen(false);
        fetchClients();
      } else {
        toast.error(data.error || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    }
  };

  const handleAddNote = async () => {
    if (!selectedClient || !newNote.trim()) return;

    try {
      const response = await fetch(`/api/clients/${selectedClient._id}/notes`, {
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
        fetchClients();
      } else {
        toast.error(data.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Client deleted successfully');
        fetchClients();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'former': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'inquiry': return 'bg-purple-100 text-purple-800';
      case 'referral': return 'bg-green-100 text-green-800';
      case 'cold_outreach': return 'bg-orange-100 text-orange-800';
      case 'conference': return 'bg-blue-100 text-blue-800';
      case 'social_media': return 'bg-pink-100 text-pink-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">Manage your client relationships and contacts</p>
          </div>
          <Button className="bg-[#4B49AC] hover:bg-[#7978E9]" onClick={handleCreateClient}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
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
                  placeholder="Search clients..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="former">Former</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Industry"
                value={filters.industry}
                onChange={(e) => handleFilterChange('industry', e.target.value)}
              />

              <Input
                placeholder="Assigned To"
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              />

              <Button variant="outline" onClick={() => setFilters({
                search: '',
                status: 'all',
                industry: '',
                assignedTo: '',
                page: 1,
                limit: 10,
              })}>
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Clients ({pagination?.totalItems || 0})
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
                      <TableHead>Client</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-[#4B49AC] text-white">
                                {client.firstName[0]}{client.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{client.firstName} {client.lastName}</div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                              {client.position && (
                                <div className="text-sm text-gray-500">{client.position}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {client.company && <div className="font-medium">{client.company}</div>}
                            {client.industry && <div className="text-sm text-gray-500">{client.industry}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSourceColor(client.source)}>
                            {client.source.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{client.totalProjects}</TableCell>
                        <TableCell>${client.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell>
                          {client.lastContact ? new Date(client.lastContact).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewClient(client)}
                            >
                              <User className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClient(client)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedClient(client);
                                setNoteDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClient(client._id)}
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
                      {pagination.totalItems} clients
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

        {/* View Client Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
              <DialogDescription>
                Complete information about {selectedClient?.firstName} {selectedClient?.lastName}
              </DialogDescription>
            </DialogHeader>

            {selectedClient && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{selectedClient.email}</span>
                      </div>
                      {selectedClient.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{selectedClient.phone}</span>
                        </div>
                      )}
                      {selectedClient.website && (
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-gray-500" />
                          <a href={selectedClient.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {selectedClient.website}
                          </a>
                        </div>
                      )}
                      {selectedClient.address && (
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                          <div>
                            {selectedClient.address.street && <div>{selectedClient.address.street}</div>}
                            {selectedClient.address.city && <div>{selectedClient.address.city}, {selectedClient.address.state} {selectedClient.address.zipCode}</div>}
                            {selectedClient.address.country && <div>{selectedClient.address.country}</div>}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Business Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Building className="w-5 h-5 mr-2" />
                        Business Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedClient.company && (
                        <div>
                          <strong>Company:</strong> {selectedClient.company}
                        </div>
                      )}
                      {selectedClient.position && (
                        <div>
                          <strong>Position:</strong> {selectedClient.position}
                        </div>
                      )}
                      {selectedClient.industry && (
                        <div>
                          <strong>Industry:</strong> {selectedClient.industry}
                        </div>
                      )}
                      <div>
                        <strong>Status:</strong>
                        <Badge className={`ml-2 ${getStatusColor(selectedClient.status)}`}>
                          {selectedClient.status}
                        </Badge>
                      </div>
                      <div>
                        <strong>Source:</strong>
                        <Badge className={`ml-2 ${getSourceColor(selectedClient.source)}`}>
                          {selectedClient.source.replace('_', ' ')}
                        </Badge>
                      </div>
                      {selectedClient.assignedTo && (
                        <div>
                          <strong>Assigned To:</strong> {selectedClient.assignedTo.firstName} {selectedClient.assignedTo.lastName}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-[#4B49AC]">{selectedClient.totalProjects}</div>
                      <p className="text-xs text-gray-600">Total Projects</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-[#98BDFF]">${selectedClient.totalRevenue.toLocaleString()}</div>
                      <p className="text-xs text-gray-600">Total Revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-[#7DA0FA]">
                        {selectedClient.lastContact ? new Date(selectedClient.lastContact).toLocaleDateString() : 'Never'}
                      </div>
                      <p className="text-xs text-gray-600">Last Contact</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {selectedClient.notes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notes ({selectedClient.notes.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedClient.notes.map((note, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
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
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button onClick={() => {
                    setViewDialogOpen(false);
                    setSelectedClient(selectedClient);
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

        {/* Create/Edit Client Dialog */}
        <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{createDialogOpen ? 'Create New Client' : 'Edit Client'}</DialogTitle>
              <DialogDescription>
                {createDialogOpen ? 'Add a new client to your database' : 'Update client information'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>

              {/* Business Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address */}
              <div>
                <Label>Address</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Input
                    placeholder="Street"
                    value={formData.address.street}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="City"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="State"
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="ZIP Code"
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, zipCode: e.target.value }
                    }))}
                  />
                </div>
                <Input
                  placeholder="Country"
                  value={formData.address.country}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, country: e.target.value }
                  }))}
                  className="mt-2"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
              }}>
                Cancel
              </Button>
              <Button onClick={createDialogOpen ? handleSubmitCreate : handleSubmitEdit}>
                {createDialogOpen ? 'Create Client' : 'Update Client'}
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
                Add a note about {selectedClient?.firstName} {selectedClient?.lastName}
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

