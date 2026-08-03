"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Shield, Plus, Edit2, Trash2, Loader2, Check, Copy, CheckCircle2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PERMISSION_MAP: Record<string, { label: string; category: string }> = {
  '*': { label: 'Full Administrative Access (*)', category: 'Administrative' },
  'tenders:read': { label: 'View Tenders', category: 'Tender Access' },
  'tenders:write': { label: 'Edit Tenders', category: 'Tender Access' },
  'tenders:export': { label: 'Export Tenders', category: 'Tender Access' },
  'tenders:scrape': { label: 'Trigger Scrapers', category: 'Tender Access' },
  'bookmarks:manage': { label: 'Manage Saved Bookmarks', category: 'Tender Access' },
  'members:read': { label: 'View Team Members', category: 'Team & Roles' },
  'members:manage': { label: 'Invite & Remove Members', category: 'Team & Roles' },
  'roles:read': { label: 'View Custom Roles', category: 'Team & Roles' },
  'roles:manage': { label: 'Create & Manage Roles', category: 'Team & Roles' },
  'keywords:read': { label: 'View Search Keywords', category: 'Keywords & Alerts' },
  'keywords:manage': { label: 'Manage Keywords', category: 'Keywords & Alerts' },
  'alerts:manage': { label: 'Manage Notification Alerts', category: 'Keywords & Alerts' },
  'settings:manage': { label: 'Manage Workspace Settings', category: 'Settings & Billing' },
  'billing:read': { label: 'View Subscriptions', category: 'Settings & Billing' },
  'billing:manage': { label: 'Manage Subscriptions', category: 'Settings & Billing' },
};

const AVAILABLE_PERMISSIONS = Object.entries(PERMISSION_MAP)
  .filter(([id]) => id !== '*')
  .map(([id, item]) => ({ id, label: item.label, category: item.category }));

export default function RolesManagementPage() {
  const { data: session } = useSession();
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null);
  
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const getHeaders = (tid: string) => ({
    'Authorization': `Bearer ${(session as any)?.accessToken || ''}`,
    'x-user-id': (session?.user as any)?.id || '',
    'x-tenant-id': tid,
    'Content-Type': 'application/json'
  });

  const fetchRoles = async (tid: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tid}/roles`, {
        headers: getHeaders(tid)
      });
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load roles.");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const userId = (session?.user as any)?.id;
      if (!userId) return;
      
      let tid = (session?.user as any)?.tenantId;

      if (!tid) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/profile/${userId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.tenant?.id) {
              tid = data.tenant.id;
            }
          }
        } catch (e) {
          console.error("Failed to resolve tenant ID:", e);
        }
      }

      if (tid && isMounted) {
        setResolvedTenantId(tid);
        fetchRoles(tid).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else if (isMounted) {
        setLoading(false);
      }
    };

    init();
    return () => { isMounted = false; };
  }, [(session?.user as any)?.id, (session?.user as any)?.tenantId]);

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPerms([]);
    setIsModalOpen(true);
  };

  const openEditModal = (role: any) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPerms(role.permissions || []);
    setIsModalOpen(true);
  };

  const openDuplicateModal = (role: any) => {
    setEditingRole(null);
    setRoleName(`Copy of ${role.name}`);
    setRoleDescription(role.description || '');
    setSelectedPerms(role.permissions || []);
    setIsModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    setSelectedPerms(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedTenantId) return;
    setSaving(true);
    try {
      const url = editingRole 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${resolvedTenantId}/roles/${editingRole.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${resolvedTenantId}/roles`;
      
      const method = editingRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(resolvedTenantId),
        body: JSON.stringify({ name: roleName, description: roleDescription, permissions: selectedPerms })
      });
      
      if (!res.ok) throw new Error('Failed to save role');
      
      toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      fetchRoles(resolvedTenantId);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not save role.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!resolvedTenantId) return;
    if (!confirm('Are you sure you want to delete this custom role? Any members with this role will lose their permissions.')) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${resolvedTenantId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: getHeaders(resolvedTenantId)
      });
      
      if (!res.ok) throw new Error('Failed to delete role');
      
      toast.success('Role deleted successfully!');
      fetchRoles(resolvedTenantId);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not delete role.");
    }
  };

  const isOwnerOrAdmin = (session?.user as any)?.tenantRole === 'OWNER' || (session?.user as any)?.tenantRole === 'ADMIN' || (session?.user as any)?.isOwner || (session?.user as any)?.globalRole === 'SUPER_ADMIN';

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  if (session && !isOwnerOrAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          Custom role management is reserved for Workspace Owners and Admins. Please contact your workspace owner if role changes are required.
        </p>
        <Button
          onClick={() => window.location.href = "/tenders"}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl px-5 py-2.5"
        >
          Return to Tenders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Role Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Create custom roles and configure explicit access permissions for your workspace.</p>
        </div>
        
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Role
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Custom Role' : 'Create Custom Role'}</DialogTitle>
            <DialogDescription>
              Define the name and the exact permissions this role will grant to users.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name</label>
              <Input 
                required 
                placeholder="e.g., Senior Estimator" 
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input 
                placeholder="Brief summary of responsibilities" 
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium">Select Permissions Granted</label>
              <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                {AVAILABLE_PERMISSIONS.map(perm => {
                  const isSelected = selectedPerms.includes(perm.id);
                  return (
                    <div 
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 text-primary shadow-xs' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-700'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{perm.label}</span>
                        <span className="text-[10px] text-gray-400 font-normal">{perm.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="w-[200px]">Role</TableHead>
              <TableHead className="w-[140px]">Type</TableHead>
              <TableHead>Permissions Granted</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {role.name}
                  </div>
                  {role.description && (
                    <div className="text-xs text-gray-500">
                      {role.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {role.isSystemRole ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs">
                      System Default
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs">
                      Custom Role
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">No specific permissions granted</span>
                    ) : role.permissions?.includes('*') ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 text-xs font-medium">
                        ⭐ Full Administrative Access (*)
                      </Badge>
                    ) : (
                      role.permissions?.map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[11px] font-normal bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400 inline-block" />
                          {PERMISSION_MAP[p]?.label || p}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {!role.isSystemRole ? (
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-gray-900"
                        onClick={() => openEditModal(role)}
                        title="Edit Role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        onClick={() => handleDelete(role.id)}
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        onClick={() => openDuplicateModal(role)}
                        title="Duplicate System Role"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                  No roles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
