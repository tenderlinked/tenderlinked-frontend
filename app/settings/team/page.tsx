"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { 
  Trash2, 
  UserPlus, 
  Shield, 
  Loader2, 
  Key, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Edit3, 
  Lock, 
  Copy, 
  RefreshCw, 
  Building2, 
  Phone, 
  Mail, 
  User as UserIcon,
  Sparkles,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
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

const PERMISSION_LABELS: Record<string, string> = {
  '*': 'Full Administrative Access (*)',
  'settings:manage': 'Manage Workspace Settings',
  'billing:read': 'View Billing & Subscriptions',
  'billing:manage': 'Manage Plan & Payments',
  'members:read': 'View Team Members',
  'members:manage': 'Manage Members & Invites',
  'roles:read': 'View Custom Roles',
  'roles:manage': 'Manage Roles & Permissions',
  'tenders:read': 'View Tenders & Search',
  'tenders:write': 'Edit Tender Info',
  'tenders:export': 'Export Tender Reports',
  'tenders:scrape': 'Trigger Scraper & Ingestion',
  'bookmarks:manage': 'Manage Saved Bookmarks',
  'keywords:read': 'View Alert Keywords',
  'keywords:manage': 'Manage Keywords & Filters',
  'alerts:manage': 'Manage Email Alerts',
  'users:read': 'View User Profiles',
  'users:manage': 'Manage User Profiles',
};

function generateM365Password(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const nums = "23456789";
  const special = "!@#$%^*";
  
  let chars: string[] = [];
  for (let i = 0; i < 4; i++) chars.push(upper.charAt(Math.floor(Math.random() * upper.length)));
  for (let i = 0; i < 5; i++) chars.push(lower.charAt(Math.floor(Math.random() * lower.length)));
  for (let i = 0; i < 4; i++) chars.push(nums.charAt(Math.floor(Math.random() * nums.length)));
  for (let i = 0; i < 3; i++) chars.push(special.charAt(Math.floor(Math.random() * special.length)));
  
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  
  return chars.join('');
}

interface TenantMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  roleId: string;
  isOwner?: boolean;
  customRole?: {
    id: string;
    name: string;
    permissions: string[];
    isSystemRole: boolean;
  };
  userProfile?: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    companyName?: string | null;
  };
}

export default function TeamSettingsPage() {
  const { data: session } = useSession();
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null);
  
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite Member Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState<string>('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [invitePasswordMode, setInvitePasswordMode] = useState<'auto' | 'manual'>('auto');
  const [invitePassword, setInvitePassword] = useState(generateM365Password());
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<TenantMember | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editPasswordMode, setEditPasswordMode] = useState<'auto' | 'manual'>('auto');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [updatingMember, setUpdatingMember] = useState(false);

  // View Permissions Popup Modal State
  const [selectedPermissionsModal, setSelectedPermissionsModal] = useState<{
    memberName: string;
    roleName: string;
    permissions: string[];
  } | null>(null);

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
      if (res.ok) {
        const data = await res.json();
        setAvailableRoles(data);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchMembers = async (tid: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tid}/members`, {
        headers: getHeaders(tid)
      });
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load team members.");
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
          console.error("Failed to resolve tenant", e);
        }
      }

      if (tid && isMounted) {
        setResolvedTenantId(tid);
        await Promise.all([fetchRoles(tid), fetchMembers(tid)]);
      }
      if (isMounted) setLoading(false);
    };

    if (session) {
      init();
    }
    return () => { isMounted = false; };
  }, [session]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !resolvedTenantId) {
      toast.error("Email is required");
      return;
    }

    setInviting(true);
    try {
      const finalPassword = invitePasswordMode === 'auto' 
        ? invitePassword 
        : (invitePassword.trim() || generateM365Password());

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${resolvedTenantId}/members`, {
        method: 'POST',
        headers: getHeaders(resolvedTenantId),
        body: JSON.stringify({ 
          email: inviteEmail,
          roleId: inviteRoleId || undefined,
          firstName: inviteFirstName,
          lastName: inviteLastName,
          password: finalPassword
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to invite user');
      }
      
      toast.success(`User invited successfully! Temporary Password: ${finalPassword}`);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInviteRoleId('');
      setInvitePassword(generateM365Password());
      setIsInviteOpen(false);
      fetchMembers(resolvedTenantId);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not invite user.");
    } finally {
      setInviting(false);
    }
  };

  const openEditModal = (member: TenantMember) => {
    setEditingMember(member);
    setEditFirstName(member.userProfile?.firstName || '');
    setEditLastName(member.userProfile?.lastName || '');
    setEditEmail(member.userProfile?.email || '');
    setEditPhoneNumber(member.userProfile?.phoneNumber || '');
    setEditCompanyName(member.userProfile?.companyName || '');
    setEditRoleId(member.roleId || '');
    setEditPasswordMode('auto');
    setEditPassword(generateM365Password());
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !resolvedTenantId) return;

    setUpdatingMember(true);
    try {
      const payload: any = {
        firstName: editFirstName,
        lastName: editLastName,
        phoneNumber: editPhoneNumber,
        companyName: editCompanyName,
        roleId: editRoleId || undefined,
      };

      if (editPassword && editPassword.trim() !== '') {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${resolvedTenantId}/members/${editingMember.userId}`, {
        method: 'PATCH',
        headers: getHeaders(resolvedTenantId),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update member profile');
      }

      toast.success("Member profile updated successfully!");
      setEditingMember(null);
      fetchMembers(resolvedTenantId);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not update member profile.");
    } finally {
      setUpdatingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!resolvedTenantId) return;
    if (!confirm('Are you sure you want to remove this member from your workspace?')) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${resolvedTenantId}/members/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(resolvedTenantId)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to remove user');
      }
      
      toast.success('User removed from tenant workspace');
      fetchMembers(resolvedTenantId);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not remove user.");
    }
  };

  const selectedInviteRole = availableRoles.find(r => r.id === inviteRoleId);

  const getMemberPermissions = (member: TenantMember, isOwner: boolean) => {
    if (isOwner || member.role === 'OWNER') return ['*'];
    if (member.customRole?.permissions?.length) return member.customRole.permissions;
    const assignedRole = availableRoles.find(r => r.id === member.roleId);
    if (assignedRole?.permissions?.length) return assignedRole.permissions;
    return ['tenders:read', 'members:read', 'roles:read'];
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
          Team member management is reserved for Workspace Owners and Admins. Please contact your workspace owner for team changes.
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Team Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage workspace members, edit profile details, and inspect assigned permissions.</p>
        </div>
        
        {/* Invite Member Dialog */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all self-start sm:self-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Invite Workspace Member
              </DialogTitle>
              <DialogDescription className="text-xs">
                Send an invitation to a team member and configure their password & role settings.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleInvite} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">First Name</label>
                  <Input 
                    placeholder="John" 
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Last Name</label>
                  <Input 
                    placeholder="Doe" 
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Email Address <span className="text-rose-500">*</span></label>
                <Input 
                  type="email" 
                  required 
                  placeholder="colleague@example.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Assign Role <span className="text-rose-500">*</span></label>
                <Select value={inviteRoleId} onValueChange={(val: any) => setInviteRoleId(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(r => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">
                        <span>{r.name} {r.isSystemRole ? '(System Default)' : ''}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role Permissions Live Preview Box */}
              {selectedInviteRole && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Permissions Granted by {selectedInviteRole.name}:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedInviteRole.permissions?.includes('*') ? (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 text-xs">
                        ⭐ Full Administrative Access (*)
                      </Badge>
                    ) : (
                      selectedInviteRole.permissions?.map((permKey: string) => (
                        <Badge key={permKey} variant="secondary" className="text-[10px] font-normal bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                          {PERMISSION_LABELS[permKey] || permKey}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Password Configuration */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Password Options
                </label>
                
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="invitePasswordType"
                      checked={invitePasswordMode === 'auto'}
                      onChange={() => {
                        setInvitePasswordMode('auto');
                        setInvitePassword(generateM365Password());
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>⚡ Auto-generate password (Recommended)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="invitePasswordType"
                      checked={invitePasswordMode === 'manual'}
                      onChange={() => {
                        setInvitePasswordMode('manual');
                        setInvitePassword('');
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>✏️ Let me create the password</span>
                  </label>
                </div>

                {invitePasswordMode === 'auto' ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Key className="w-4 h-4 text-blue-600 shrink-0" />
                      <code className="text-xs font-mono font-bold text-blue-900 dark:text-blue-200 select-all truncate">
                        {invitePassword}
                      </code>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                        onClick={() => setInvitePassword(generateM365Password())}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Generate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px] border-blue-300 text-blue-800"
                        onClick={() => {
                          navigator.clipboard.writeText(invitePassword);
                          toast.success("Password copied!");
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type={showInvitePassword ? "text" : "password"}
                      placeholder="Enter a custom password..."
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      className="pr-10 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowInvitePassword(!showInvitePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showInvitePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-xl" disabled={inviting}>
                {inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Send Invitation & Add Member
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
            <TableRow>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">User Profile</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Role</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Granted Permissions</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right text-slate-700 dark:text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((member, index) => {
              const isMemberOwner = member.role === 'OWNER' || (member as any).isOwner || (index === 0 && members.length > 0);
              const perms = getMemberPermissions(member, isMemberOwner);
              const memberName = [member.userProfile?.firstName, member.userProfile?.lastName].filter(Boolean).join(' ');
              const memberEmail = member.userProfile?.email || 'N/A';
              const assignedRole = availableRoles.find(r => r.id === member.roleId);

              return (
                <TableRow key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-800 shrink-0">
                        {memberEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {memberName || memberEmail}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {memberEmail}
                        </span>
                        {member.userProfile?.phoneNumber && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {member.userProfile.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2">
                      {isMemberOwner ? (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 h-7 font-bold px-3 text-xs">
                          <Shield className="w-3.5 h-3.5 mr-1" /> Owner
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2.5 py-1 text-xs">
                          {assignedRole?.name || 'Tenant Member'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Clean Popup Permission Button */}
                  <TableCell className="py-3.5">
                    {perms.includes('*') ? (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 text-xs font-bold px-2.5 py-1">
                        ⭐ Full Access (*)
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                        onClick={() => setSelectedPermissionsModal({
                          memberName: memberName || memberEmail,
                          roleName: assignedRole?.name || 'Tenant Member',
                          permissions: perms
                        })}
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>View Permissions ({perms.length})</span>
                      </Button>
                    )}
                  </TableCell>

                  <TableCell className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg text-xs font-medium"
                        onClick={() => openEditModal(member)}
                        title="Edit Profile & Password"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>

                      {!isMemberOwner && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                          onClick={() => handleRemoveMember(member.userId)}
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-slate-500 dark:text-slate-400">
                  No team members found in this workspace.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Permissions Inspection Popup Modal */}
      {selectedPermissionsModal && (
        <Dialog open={!!selectedPermissionsModal} onOpenChange={() => setSelectedPermissionsModal(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Granted Workspace Permissions
              </DialogTitle>
              <DialogDescription className="text-xs">
                Permissions assigned to <strong className="text-slate-900 dark:text-white">{selectedPermissionsModal.memberName}</strong> via role <Badge variant="secondary" className="text-[10px] ml-1">{selectedPermissionsModal.roleName}</Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {selectedPermissionsModal.permissions.map((permKey) => (
                <div key={permKey} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {PERMISSION_LABELS[permKey] || permKey}
                  </span>
                  <code className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    {permKey}
                  </code>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setSelectedPermissionsModal(null)} className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Member Profile Modal */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Edit Member Profile
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update name, contact info, role, or password for <strong className="text-slate-900 dark:text-white">{editEmail}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateMember} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">First Name</label>
                  <Input 
                    placeholder="First Name" 
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Last Name</label>
                  <Input 
                    placeholder="Last Name" 
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Mobile Number</label>
                  <Input 
                    type="tel"
                    placeholder="+91 9876543210" 
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Company Name</label>
                  <Input 
                    placeholder="Company Name" 
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Assign Role</label>
                <Select value={editRoleId} onValueChange={(val: string) => setEditRoleId(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(r => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">
                        <span>{r.name} {r.isSystemRole ? '(System Default)' : ''}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Password Selector */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Reset Member Password
                </label>
                
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="editPasswordType"
                      checked={editPasswordMode === 'auto'}
                      onChange={() => {
                        setEditPasswordMode('auto');
                        setEditPassword(generateM365Password());
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>⚡ Auto-generate new password</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="editPasswordType"
                      checked={editPasswordMode === 'manual'}
                      onChange={() => {
                        setEditPasswordMode('manual');
                        setEditPassword('');
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>✏️ Type a new manual password</span>
                  </label>
                </div>

                {editPasswordMode === 'auto' ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Key className="w-4 h-4 text-blue-600 shrink-0" />
                      <code className="text-xs font-mono font-bold text-blue-900 dark:text-blue-200 select-all truncate">
                        {editPassword || 'Click generate below'}
                      </code>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                        onClick={() => setEditPassword(generateM365Password())}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Generate
                      </Button>
                      {editPassword && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] border-blue-300 text-blue-800"
                          onClick={() => {
                            navigator.clipboard.writeText(editPassword);
                            toast.success("Password copied!");
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type={showEditPassword ? "text" : "password"}
                      placeholder="Type a new password (leave blank to keep unchanged)..."
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="pr-10 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingMember(null)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updatingMember} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4">
                  {updatingMember ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
