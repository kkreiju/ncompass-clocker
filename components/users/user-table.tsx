'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserSearch } from "./user-search";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Users, Edit, Trash2, QrCode, AlertCircle } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string, userName: string) => void;
  onShowQR: (userName: string) => void;
}

export function UserTable({ users, loading, onEdit, onDelete, onShowQR }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarPath = (user: User) => {
    // Check if user has an avatar field
    if (user.avatar) {
      return user.avatar;
    }

    // Map user names to profile pictures
    const nameLower = user.name.toLowerCase();
    if (nameLower.includes('saguisa')) {
      return '/user-profile/saguisa.png';
    }
    if (nameLower.includes('albores')) {
      return '/user-profile/albores.png';
    }
    if (nameLower.includes('bernabe')) {
      return '/user-profile/bernabe.png';
    }
    if (nameLower.includes('busal')) {
      return '/user-profile/busal.png';
    }
    if (nameLower.includes('claro')) {
      return '/user-profile/claro.png';
    }
    if (nameLower.includes('mendez')) {
      return '/user-profile/mendez.png';
    }
    if (nameLower.includes('rubica')) {
      return '/user-profile/rubica.png';
    }

    // Default to no avatar (will show initials)
    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Search Bar - Keep visible during loading */}
        <UserSearch
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />

        {/* Users Table Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <UserSearch
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({filteredUsers.length})
            </div>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages || 1}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found. Add your first user to get started.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {currentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-background">
                      <AvatarImage src={getAvatarPath(user)} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <button
                        onClick={() => onShowQR(user.name)}
                        className="font-semibold text-left hover:text-primary transition-colors"
                      >
                        {user.name}
                      </button>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(user._id, user.name)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
