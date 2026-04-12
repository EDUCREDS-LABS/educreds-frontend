import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash2, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// Generic column helpers
export function createTextColumn<T>(
  accessorKey: keyof T,
  header: string,
  options?: {
    sortable?: boolean;
    className?: string;
    cell?: (value: any, row: T) => React.ReactNode;
  }
): ColumnDef<T> {
  return {
    accessorKey: accessorKey as string,
    header: ({ column }) => {
      if (options?.sortable !== false) {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            {header}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      }
      return header;
    },
    cell: ({ getValue, row }) => {
      const value = getValue();
      if (options?.cell) {
        return options.cell(value, row.original);
      }
      return <span className={options?.className}>{String(value || "")}</span>;
    },
    enableSorting: options?.sortable !== false,
  };
}

export function createBadgeColumn<T>(
  accessorKey: keyof T,
  header: string,
  options?: {
    sortable?: boolean;
    variant?: "default" | "secondary" | "destructive" | "outline";
    getVariant?: (value: any, row: T) => "default" | "secondary" | "destructive" | "outline";
    getLabel?: (value: any, row: T) => string;
  }
): ColumnDef<T> {
  return {
    accessorKey: accessorKey as string,
    header: ({ column }) => {
      if (options?.sortable !== false) {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            {header}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      }
      return header;
    },
    cell: ({ getValue, row }) => {
      const value = getValue();
      const variant = options?.getVariant?.(value, row.original) || options?.variant || "default";
      const label = options?.getLabel?.(value, row.original) || String(value || "");

      return <Badge variant={variant}>{label}</Badge>;
    },
    enableSorting: options?.sortable !== false,
  };
}

export function createDateColumn<T>(
  accessorKey: keyof T,
  header: string,
  options?: {
    sortable?: boolean;
    format?: string;
    className?: string;
  }
): ColumnDef<T> {
  return {
    accessorKey: accessorKey as string,
    header: ({ column }) => {
      if (options?.sortable !== false) {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            {header}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      }
      return header;
    },
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return <span className="text-muted-foreground">—</span>;

      const date = new Date(value);
      const formatted = format(date, options?.format || "MMM dd, yyyy");

      return <span className={options?.className}>{formatted}</span>;
    },
    enableSorting: options?.sortable !== false,
  };
}

export function createAvatarColumn<T>(
  header: string,
  options: {
    getName: (row: T) => string;
    getEmail?: (row: T) => string;
    getImage?: (row: T) => string;
    className?: string;
  }
): ColumnDef<T> {
  return {
    id: "avatar",
    header,
    cell: ({ row }) => {
      const name = options.getName(row.original);
      const email = options.getEmail?.(row.original);
      const image = options.getImage?.(row.original);

      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-semibold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{name}</p>
            {email && (
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            )}
          </div>
        </div>
      );
    },
    enableSorting: false,
  };
}

export function createActionsColumn<T>(
  actions: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (row: T) => void;
    variant?: "default" | "destructive" | "secondary";
    disabled?: (row: T) => boolean;
  }>
): ColumnDef<T> {
  return {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const rowData = row.original;

      if (actions.length === 1) {
        const action = actions[0];
        const Icon = action.icon;
        const disabled = action.disabled?.(rowData);

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => action.onClick(rowData)}
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            {Icon && <Icon className="h-4 w-4" />}
          </Button>
        );
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {actions.map((action, index) => {
              const Icon = action.icon;
              const disabled = action.disabled?.(rowData);

              return (
                <DropdownMenuItem
                  key={index}
                  onClick={() => action.onClick(rowData)}
                  disabled={disabled}
                  className={action.variant === "destructive" ? "text-destructive" : ""}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  };
}

// Specific column helpers for common use cases
export function createUserColumns<T extends { name: string; email: string; role?: string; status?: string; createdAt?: string }>(
  onEdit?: (user: T) => void,
  onDelete?: (user: T) => void,
  onView?: (user: T) => void
): ColumnDef<T>[] {
  const columns: ColumnDef<T>[] = [
    createAvatarColumn("User", {
      getName: (row) => row.name,
      getEmail: (row) => row.email,
    }),
    createTextColumn("name", "Name", { sortable: true }),
    createTextColumn("email", "Email", { sortable: true }),
    createBadgeColumn("role", "Role", {
      sortable: true,
      getVariant: (value) => {
        switch (value) {
          case "admin": return "destructive";
          case "reviewer": return "default";
          case "viewer": return "secondary";
          default: return "outline";
        }
      },
    }),
    createBadgeColumn("status", "Status", {
      sortable: true,
      getVariant: (value) => {
        switch (value) {
          case "active": return "default";
          case "inactive": return "secondary";
          case "pending": return "outline";
          default: return "outline";
        }
      },
    }),
    createDateColumn("createdAt", "Created", {
      sortable: true,
      format: "MMM dd, yyyy",
    }),
  ];

  if (onView || onEdit || onDelete) {
    const actions = [];
    if (onView) actions.push({ label: "View", icon: Eye, onClick: onView });
    if (onEdit) actions.push({ label: "Edit", icon: Edit, onClick: onEdit });
    if (onDelete) actions.push({ label: "Delete", icon: Trash2, onClick: onDelete, variant: "destructive" as const });

    columns.push(createActionsColumn(actions));
  }

  return columns;
}

export function createCertificateColumns<T extends {
  studentName: string;
  courseName: string;
  grade?: string;
  status?: string;
  issueDate?: string;
  ipfsHash?: string;
}>(
  onEdit?: (cert: T) => void,
  onDelete?: (cert: T) => void,
  onView?: (cert: T) => void
): ColumnDef<T>[] {
  const columns: ColumnDef<T>[] = [
    createTextColumn("studentName", "Student", { sortable: true }),
    createTextColumn("courseName", "Course", { sortable: true }),
    createTextColumn("grade", "Grade", { sortable: true }),
    createBadgeColumn("status", "Status", {
      sortable: true,
      getVariant: (value) => {
        switch (value) {
          case "issued": return "default";
          case "revoked": return "destructive";
          case "pending": return "outline";
          default: return "secondary";
        }
      },
    }),
    createDateColumn("issueDate", "Issued", {
      sortable: true,
      format: "MMM dd, yyyy",
    }),
    createTextColumn("ipfsHash", "IPFS Hash", {
      sortable: false,
      cell: (value) => (
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
          {value ? `${value.slice(0, 8)}...` : "—"}
        </code>
      ),
    }),
  ];

  if (onView || onEdit || onDelete) {
    const actions = [];
    if (onView) actions.push({ label: "View", icon: Eye, onClick: onView });
    if (onEdit) actions.push({ label: "Edit", icon: Edit, onClick: onEdit });
    if (onDelete) actions.push({ label: "Revoke", icon: Trash2, onClick: onDelete, variant: "destructive" as const });

    columns.push(createActionsColumn(actions));
  }

  return columns;
}