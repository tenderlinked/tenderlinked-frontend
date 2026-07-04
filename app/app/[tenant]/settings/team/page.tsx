"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Trash2, UserPlus, Shield, User, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

interface TenantMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  roleId: string;
  customRole?: {
    id: string;
    name: string;
    isSystemRole: boolean;
  };
  userProfile?: {
    email: string;
    companyName?: string;
  };
}

export default function TeamSettingsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const tenantId = params.tenant as string;
  
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState<string>('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (session?.accessToken && tenantId) {
      Promise.all([fetchMembers(), fetchRoles()]).then(() => setLoading(false));
    }
  }, [session, tenantId]);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/roles`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableRoles(data);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/members`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load team members.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/members`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail, roleId: inviteRoleId || undefined })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to invite user');
      }
      
      toast.success('User invited successfully!');
      setInviteEmail('');
      setInviteRoleId('');
      setIsInviteOpen(false);
      fetchMembers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not invite user.");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleId: newRoleId })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update role');
      }
      
      toast.success('Role updated successfully!');
      fetchMembers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not update role.");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to remove member');
      }
      
      toast.success('Member removed successfully!');
      fetchMembers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not remove member.");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Team Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage members and roles in your workspace.</p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Invite a new user to your workspace. If they don't have an account, one will be created for them and they will receive an email.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input 
                  type="email" 
                  required 
                  placeholder="colleague@example.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role (Optional)</label>
                <Select value={inviteRoleId} onValueChange={(val: any) => setInviteRoleId(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign a default system role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} {r.isSystemRole ? '(System Default)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">If left blank, the default user role will be assigned.</p>
              </div>
              <Button type="submit" className="w-full" disabled={inviting}>
                {inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Send Invitation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {member.userProfile?.email.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {member.userProfile?.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.userProfile?.companyName || 'No Company'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Select 
                      value={member.roleId || ''} 
                      onValueChange={(val: any) => handleRoleChange(member.userId, val)}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Assign Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} {r.isSystemRole ? '(System)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {member.isOwner && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 h-6">
                        <Shield className="w-3 h-3 mr-1" /> Owner
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {!member.isOwner && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                      onClick={() => handleRemoveMember(member.userId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                  No team members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
