'use client';

import { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Check, ChevronsUpDown, Search } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  profileURL?: string;
  createdAt: string;
}

interface RateCalculatorEmployeeSelectorProps {
  users: User[];
  selectedUser: string;
  onUserChange: (userId: string) => void;
}

export function RateCalculatorEmployeeSelector({
  users,
  selectedUser,
  onUserChange,
}: RateCalculatorEmployeeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedUserData = useMemo(() =>
    users.find(user => user._id === selectedUser),
    [users, selectedUser]
  );

  // Filter and sort users based on search query
  const filteredUsers = useMemo(() =>
    users
      .filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [users, searchQuery]
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarPath = (user: User) => {
    if (user.profileURL && user.profileURL.trim() !== '') {
      return user.profileURL;
    }
    return undefined;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-md">
          <User className="h-4 w-4 text-primary" />
        </div>
        <Label className="text-sm font-medium">Select Employee</Label>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 w-full justify-between text-left"
          >
            {selectedUserData ? (
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar className="w-8 h-8 border border-background flex-shrink-0">
                  <AvatarImage src={getAvatarPath(selectedUserData)} alt={selectedUserData.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {getInitials(selectedUserData.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-sm sm:text-base">
                    {selectedUserData.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {selectedUserData.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Choose an employee...</span>
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Employee
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Search Employee</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type name or email to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-base"
                  autoFocus
                />
              </div>
              {searchQuery && (
                <p className="text-xs text-muted-foreground">
                  {filteredUsers.length} employee{filteredUsers.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>

            {/* Employee List */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {searchQuery ? 'Search Results' : 'All Employees'} ({filteredUsers.length})
              </Label>
              <ScrollArea className="h-64 sm:h-80 border rounded-lg">
                <div className="p-2">
                  {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-lg mb-1">No employees found</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? 'Try adjusting your search terms' : 'No employees available'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedUser === user._id
                              ? 'bg-primary/10 border-2 border-primary/20 shadow-sm'
                              : 'hover:bg-muted/50 border-2 border-transparent'
                          }`}
                          onClick={() => {
                            onUserChange(user._id);
                            setOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <Avatar className={`w-10 h-10 sm:w-12 sm:h-12 border-2 flex-shrink-0 ${
                            selectedUser === user._id ? 'border-primary' : 'border-border'
                          }`}>
                            <AvatarImage src={getAvatarPath(user)} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start sm:items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base truncate">{user.name}</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
                              </div>
                              {selectedUser === user._id && (
                                <div className="flex items-center gap-1 text-xs text-primary font-medium flex-shrink-0">
                                  <Check className="h-3 w-3" />
                                  <span className="hidden sm:inline">Selected</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {selectedUser === user._id && (
                            <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex-shrink-0">
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Quick Actions */}
            {selectedUserData && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-primary truncate">{selectedUserData.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{selectedUserData.email}</p>
                    </div>
                  </div>
                  <div className="flex justify-start sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        onUserChange("");
                        setSearchQuery("");
                      }}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
