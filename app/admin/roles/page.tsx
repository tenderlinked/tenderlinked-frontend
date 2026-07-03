"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, ShieldCheck, Trash2, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import toast from "react-hot-toast";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

const PERMISSION_GROUPS = [
  {
    category: "Tenders & Bookmarks",
    permissions: [
      { id: 'tenders:read', label: 'View Tenders' },
      { id: 'tenders:export', label: 'Export Tenders' },
      { id: 'bookmarks:manage', label: 'Save & Manage Bookmarks' },
    ]
  },
  {
    category: "Keywords & Alerts",
    permissions: [
      { id: 'keywords:read', label: 'View Keyword Trackers' },
      { id: 'keywords:manage', label: 'Manage Keyword Trackers' },
      { id: 'alerts:manage', label: 'Manage Alert Preferences' },
    ]
  },
  {
    category: "Team & Roles",
    permissions: [
      { id: 'members:read', label: 'View Team Members' },
      { id: 'members:manage', label: 'Manage Team Members' },
      { id: 'roles:manage', label: 'Manage Custom Roles' },
    ]
  },
  {
    category: "Billing & Settings",
    permissions: [
      { id: 'billing:read', label: 'View Billing & Invoices' },
      { id: 'billing:manage', label: 'Manage Billing & Plans' },
      { id: 'settings:manage', label: 'Manage Workspace Settings' },
    ]
  },
  {
    category: "System Administrator",
    permissions: [
      { id: '*', label: 'Absolute Full Access (Admin)' },
    ]
  }
];

export default function SystemRolesPage() {
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (category: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchRoles();
    }
  }, [status]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/roles/system`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      } else {
        toast.error("Failed to fetch system roles");
      }
    } catch (e) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this system role?")) return;
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/roles/system/${roleId}`, {
        method: "DELETE",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success("Role deleted");
        fetchRoles();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to delete role");
      }
    } catch (e) {
      toast.error("Error deleting role");
    }
  };

  const handleSaveRole = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const url = editingRole 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/roles/system/${editingRole.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/roles/system`;
        
      const res = await fetch(url, {
        method: editingRole ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editingRole ? "Role updated" : "Role created");
        setIsSheetOpen(false);
        fetchRoles();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to save role");
      }
    } catch (e) {
      toast.error("Error saving role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setIsSheetOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '', permissions: role.permissions });
    setIsSheetOpen(true);
  };

  const togglePermission = (permId: string) => {
    if (formData.permissions.includes(permId)) {
      setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== permId) });
    } else {
      setFormData({ ...formData, permissions: [...formData.permissions, permId] });
    }
  };

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            System Roles
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Define base roles and permissions that tenant admins can assign to users.
          </p>
        </div>
        <Button onClick={openCreateModal} className="shrink-0 h-10 px-4">
          <Plus className="w-4 h-4 mr-2" />
          Create System Role
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b bg-white dark:bg-gray-950 pb-4 pt-5 px-6 rounded-t-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle className="text-xl text-gray-900 dark:text-white">Role Definitions</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter roles..."
                  className="pl-9 h-9 bg-gray-50/50 border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold">Role Name</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Permissions</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading roles...</td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No roles found.</td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors bg-white dark:bg-gray-950">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {role.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {role.description || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map(perm => (
                            <Badge key={perm} variant="secondary" className="text-[10px] font-normal py-0">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 mr-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => openEditModal(role)}>
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteRole(role.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl w-full border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
          <SheetHeader className="pb-6 border-b border-gray-100 dark:border-gray-800 mb-6">
            <SheetTitle className="text-2xl">{editingRole ? 'Edit Role' : 'Create System Role'}</SheetTitle>
            <SheetDescription>
              Define the role name and exact permissions.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role Name</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Billing Manager" 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="Briefly describe this role's purpose" 
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Role Permissions</h4>
              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => {
                  const assignedCount = group.permissions.filter(p => formData.permissions.includes(p.id)).length;
                  return (
                    <div key={group.category} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                      <button 
                        className="w-full flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => toggleGroup(group.category)}
                      >
                        <div className="flex items-center gap-3">
                          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{group.category}</h5>
                          <Badge variant={assignedCount > 0 ? "default" : "secondary"} className="text-[10px] py-0 px-2 h-5">
                            {assignedCount} / {group.permissions.length}
                          </Badge>
                        </div>
                        {expandedGroups[group.category] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>
                      
                      {expandedGroups[group.category] && (
                        <div className="p-3 space-y-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                          {group.permissions.map(perm => (
                            <label key={perm.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors">
                              <input 
                                type="checkbox" 
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={formData.permissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                              />
                              <div>
                                <div className="text-sm font-medium">{perm.label}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{perm.id}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveRole} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Role'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
