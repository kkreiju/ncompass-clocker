'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

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
    <div className="w-full">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Search Input */}
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-12 text-base bg-background border-2 focus:border-primary/50 transition-colors"
        />

        {/* Clear Button */}
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-3 w-3" />
          <span>Searching for "{searchTerm}"</span>
        </div>
      )}
    </div>
  );
}
