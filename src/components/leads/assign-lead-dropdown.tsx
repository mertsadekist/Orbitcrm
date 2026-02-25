"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAssignLead } from "@/hooks/use-lead-mutation";
import type { CompanyUser } from "@/types/lead";

type AssignLeadDropdownProps = {
  leadId: string;
  currentAssigneeId: string | null;
  companyUsers: CompanyUser[];
  onAssign?: (userId: string | null) => void;
};

export function AssignLeadDropdown({
  leadId,
  currentAssigneeId,
  companyUsers,
  onAssign,
}: AssignLeadDropdownProps) {
  const [open, setOpen] = useState(false);
  const assignLead = useAssignLead();

  const currentUser = companyUsers.find((u) => u.id === currentAssigneeId);
  const buttonLabel = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : "Unassigned";

  const handleSelect = (userId: string | null) => {
    if (onAssign) {
      onAssign(userId);
    } else {
      assignLead.mutate({ leadId, assignedToId: userId });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <span className="truncate">{buttonLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {/* Unassign option */}
              <CommandItem
                value="__unassign__"
                onSelect={() => handleSelect(null)}
              >
                <UserX className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Unassign</span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    currentAssigneeId === null ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>

              {/* Users */}
              {companyUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.firstName} ${user.lastName} ${user.email}`}
                  onSelect={() => handleSelect(user.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentAssigneeId === user.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
