'use client';

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UserSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function UserSearch({
  searchTerm,
  onSearchChange,
  placeholder = "Search users by name or email..."
}: UserSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center bg-muted/30 px-6 py-4 rounded-lg border">
      {/* Search Icon */}
      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-md flex-shrink-0">
        <Search className="h-4 w-4 text-primary" />
      </div>

      {/* Search Bar - Made larger by removing max-width constraint */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10"
        />
      </div>
    </div>
  );
}
