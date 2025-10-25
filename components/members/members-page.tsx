"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberForm } from "./member-form";
import { MemberQRCode } from "./member-qr-code";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, QrCode } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  qrCode: string;
  isActive: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  membershipPlan?: {
    id: string;
    name: string;
    price: string;
    durationDays: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface MembersResponse {
  data: Member[];
  pagination: PaginationInfo;
}

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const fetchMembers = async (page = 1, search = "", isActive = "all") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(isActive !== "all" && { isActive }),
      });

      const response = await fetch(`/api/members?${params}`);
      if (!response.ok) throw new Error("Failed to fetch members");

      const data: MembersResponse = await response.json();
      setMembers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load members");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(pagination.page, searchTerm, isActiveFilter);
  }, [pagination.page, searchTerm, isActiveFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (value: string) => {
    setIsActiveFilter(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleCreateMember = (newMember: Member) => {
    setMembers([newMember, ...members]);
    setIsCreateModalOpen(false);
    toast.success("Member created successfully");
  };

  const handleEditMember = (updatedMember: Member) => {
    setMembers(members.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    setIsEditModalOpen(false);
    setSelectedMember(null);
    toast.success("Member updated successfully");
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete member");

      setMembers(members.filter((m) => m.id !== memberId));
      toast.success("Member deleted successfully");
    } catch (error) {
      toast.error("Failed to delete member");
      console.error(error);
    }
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const openQRModal = (member: Member) => {
    setSelectedMember(member);
    setIsQRModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Select value={isActiveFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Member</DialogTitle>
              <DialogDescription>
                Add a new member to the gym. They will receive a unique QR code for check-ins.
              </DialogDescription>
            </DialogHeader>
            <MemberForm onSuccess={handleCreateMember} onCancel={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({pagination.total})</CardTitle>
          <CardDescription>
            Manage your gym members and their membership plans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No members found</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell>{member.email || "-"}</TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell>
                        {member.membershipPlan ? (
                          <Badge variant="secondary">
                            {member.membershipPlan.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Plan</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(member.joinedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openQRModal(member)}>
                              <QrCode className="mr-2 h-4 w-4" />
                              View QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteMember(member.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} members
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page - 1 })
                      }
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page + 1 })
                      }
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information and membership plan.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <MemberForm
              member={selectedMember}
              onSuccess={handleEditMember}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedMember(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Member QR Code</DialogTitle>
            <DialogDescription>
              This QR code can be used for gym check-ins.
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <MemberQRCode
              member={selectedMember}
              onClose={() => {
                setIsQRModalOpen(false);
                setSelectedMember(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}