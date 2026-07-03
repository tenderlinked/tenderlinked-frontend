"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Shield, Plus, Edit2, Trash2, Loader2, Check } from 'lucide-react';
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

const AVAILABLE_PERMISSIONS = [
  { id: 'settings:manage', label: 'Manage Settings' },
  { id: 'billing:manage', label: 'Manage Billing' },
  { id: 'members:manage', label: 'Manage Team Members' },
  { id: 'roles:manage', label: 'Manage Roles' },
  { id: 'tenders:view', label: 'View Tenders' },
  { id: 'bookmarks:manage', label: 'Manage Bookmarks' },
];

export default function RolesManagementPage() {
  const { data: session } = useSession();
  const params = useParams();
  const tenantId = params.tenant as string;
  
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.accessToken && tenantId) {
      fetchRoles();
    }
  }, [session, tenantId]);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/roles`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load roles.");
    } finally {
      setLoading(false);
    }
  };

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

  const togglePermission = (permId: string) => {
    setSelectedPerms(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingRole 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/roles/${editingRole.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/roles`;
      
      const method = editingRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: roleName, description: roleDescription, permissions: selectedPerms })
      });
      
      if (!res.ok) throw new Error('Failed to save role');
      
      toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not save role.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this custom role? Any members with this role will lose their permissions.')) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete role');
      
      toast.success('Role deleted successfully!');
      fetchRoles();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not delete role.");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Role Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Create custom roles and configure their permissions.</p>
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
                placeholder="e.g., Billing Manager" 
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input 
                placeholder="Can only view and manage billing information" 
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium">Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_PERMISSIONS.map(perm => {
                  const isSelected = selectedPerms.includes(perm.id);
                  return (
                    <div 
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sm font-medium">{perm.label}</span>
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
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      System Default
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                      Custom Role
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.length === 0 ? (
                      <span className="text-xs text-gray-400">No specific permissions</span>
                    ) : role.permissions?.includes('*') ? (
                      <Badge variant="secondary" className="text-xs">Full Access (*)</Badge>
                    ) : (
                      role.permissions?.map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-[10px] font-normal">
                          {p}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {!role.isSystemRole && (
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-gray-900"
                        onClick={() => openEditModal(role)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        onClick={() => handleDelete(role.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
