"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Plus, Filter, Users, ShieldAlert, LogIn, Trash2, Building, Activity, CreditCard, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
  subscription: {
    planType: string;
    status: string;
  } | null;
  _count: {
    members: number;
  };
  ownerEmail: string | null;
}

export default function TenantManagementPage() {
  const { data: session, status } = useSession();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Manage Tenant Modal State
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [tenantMembers, setTenantMembers] = useState<any[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [systemRoles, setSystemRoles] = useState<any[]>([]);

  // Subdomain Edit State
  const [subdomainInput, setSubdomainInput] = useState("");
  const [isUpdatingSubdomain, setIsUpdatingSubdomain] = useState(false);

  // Bulk Actions State
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTenants();
      fetchSystemRoles();
    }
  }, [status]);

  const fetchSystemRoles = async () => {
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/roles/system`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSystemRoles(data);
      }
    } catch (e) {
      console.error("Failed to fetch system roles", e);
    }
  };

  const fetchTenants = async () => {
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      } else {
        toast.error("Failed to fetch tenants");
      }
    } catch (e) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (tenantId: string, planType: string, newStatus: string) => {
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/subscription`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ planType, status: newStatus })
      });
      if (res.ok) {
        toast.success("Subscription updated");
        fetchTenants();
      } else {
        toast.error("Failed to update subscription");
      }
    } catch (e) {
      toast.error("Error updating subscription");
    }
  };

  const openManageModal = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setSubdomainInput(tenant.subdomain);
    setIsSheetOpen(true);
    setTenantMembers([]);
    setIsMembersLoading(true);

    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenant.id}/admin/members`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setTenantMembers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleUpdateSubdomain = async () => {
    if (!selectedTenant || !subdomainInput.trim()) return;
    try {
      setIsUpdatingSubdomain(true);
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${selectedTenant.id}/subdomain`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ subdomain: subdomainInput.trim() })
      });
      if (res.ok) {
        toast.success("Subdomain updated");
        setSelectedTenant({ ...selectedTenant, subdomain: subdomainInput.trim() });
        fetchTenants();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update subdomain");
      }
    } catch (e) {
      toast.error("Error updating subdomain");
    } finally {
      setIsUpdatingSubdomain(false);
    }
  };

  const handleDeleteMember = async (userId: string) => {
    if (!selectedTenant) return;
    if (!confirm("Are you sure you want to force remove this member?")) return;
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${selectedTenant.id}/admin/members/${userId}`, {
        method: "DELETE",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success("Member removed successfully");
        setTenantMembers(tenantMembers.filter(m => m.userId !== userId));
        fetchTenants(); // update count
      } else {
        toast.error("Failed to remove member");
      }
    } catch (e) {
      toast.error("Error removing member");
    }
  };

  const handleAddMember = async (tenantId: string, email: string, roleId: string) => {
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${tenantId}/members`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ email, roleId })
      });
      if (res.ok) {
        toast.success("Member added successfully");
        (document.getElementById('newMemberEmail') as HTMLInputElement).value = '';
        openManageModal(selectedTenant!); // refresh members
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to add member");
      }
    } catch (e) {
      toast.error("Error adding member");
    }
  };

  const handleMakeSuperAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to grant this user Super Admin privileges?")) return;
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${userId}/super-admin`, {
        method: "POST",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success("User promoted to Super Admin");
      } else {
        toast.error("Failed to promote user");
      }
    } catch (e) {
      toast.error("Error promoting user");
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    if (!confirm(`DANGER: Are you sure you want to permanently delete ${selectedTenant.name} and ALL of its data? This cannot be undone.`)) return;
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${selectedTenant.id}`, {
        method: "DELETE",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success("Tenant permanently deleted");
        setIsSheetOpen(false);
        fetchTenants();
      } else {
        toast.error("Failed to delete tenant");
      }
    } catch (e) {
      toast.error("Error deleting tenant");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTenantIds.size === 0) return;
    if (!confirm(`DANGER: Are you sure you want to permanently delete ${selectedTenantIds.size} tenants and ALL of their data? This cannot be undone.`)) return;
    try {
      setIsBulkDeleting(true);
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ids: Array.from(selectedTenantIds) })
      });
      if (res.ok) {
        toast.success(`${selectedTenantIds.size} tenants permanently deleted`);
        setSelectedTenantIds(new Set());
        fetchTenants();
      } else {
        toast.error("Failed to delete tenants");
      }
    } catch (e) {
      toast.error("Error deleting tenants");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedTenantIds.size === filteredTenants.length && filteredTenants.length > 0) {
      setSelectedTenantIds(new Set());
    } else {
      setSelectedTenantIds(new Set(filteredTenants.map(t => t.id)));
    }
  };

  const toggleSelectTenant = (id: string) => {
    const newSet = new Set(selectedTenantIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTenantIds(newSet);
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading") {
    return <div className="p-12 text-center">Loading tenants...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Tenant Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View and manage all tenant workspaces, subscriptions, and access.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="text-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Tenant
          </Button>
        </div>
      </div>

      {/* Tenant Registry Table */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b bg-white dark:bg-gray-950 pb-4 pt-5 px-6 rounded-t-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">Tenant Registry</CardTitle>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter tenants..."
                  className="pl-9 h-9 bg-gray-50/50 border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {selectedTenantIds.size > 0 && (
                <Button variant="destructive" className="h-9" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Selected ({selectedTenantIds.size})
                </Button>
              )}
              <Button variant="outline" size="icon" className="h-9 w-9 border-gray-200">
                <Filter className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={filteredTenants.length > 0 && selectedTenantIds.size === filteredTenants.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">Organization</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Subdomain</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading tenants...</td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No tenants found.</td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors bg-white dark:bg-gray-950 ${selectedTenantIds.has(tenant.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedTenantIds.has(tenant.id)}
                          onChange={() => toggleSelectTenant(tenant.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {tenant.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{tenant.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Joined {new Date(tenant.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.subscription ? (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 capitalize font-medium rounded text-xs px-2 py-0.5">
                            {tenant.subscription.planType}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 font-medium rounded text-xs px-2 py-0.5">
                            FREE
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            (!tenant.subscription || tenant.subscription.status === 'ACTIVE')
                              ? 'bg-emerald-500' 
                              : tenant.subscription.status === 'SUSPENDED' 
                                ? 'bg-red-500' 
                                : 'bg-gray-400'
                          }`}></div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {tenant.subscription?.status?.toLowerCase() || 'active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">
                        {tenant.ownerEmail || <span className="text-gray-400 italic">Unknown Email</span>}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            const protocol = window.location.protocol;
                            const hostparts = window.location.host.split('.');
                            const rootDomain = hostparts.length > 2 ? hostparts.slice(1).join('.') : hostparts.join('.');
                            window.open(`${protocol}//${tenant.subdomain}.${rootDomain}/dashboard`, '_blank');
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline flex items-center gap-1.5 transition-colors"
                        >
                          {tenant.subdomain}
                          <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="link" className="font-semibold text-sm" onClick={() => openManageModal(tenant)}>
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t px-6 py-3 bg-gray-50/30 dark:bg-gray-900/30 flex justify-between items-center text-sm text-gray-500">
            <div>Showing {filteredTenants.length} of {tenants.length || '1,284'} tenants</div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 border-gray-200">Prev</Button>
              <Button variant="outline" size="sm" className="h-8 border-gray-200">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Management Modal */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto w-[400px]">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-2xl">{selectedTenant?.name}</SheetTitle>
            <SheetDescription>
              Manage workspace settings, members, and billing.
            </SheetDescription>
          </SheetHeader>

          {selectedTenant && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members ({tenantMembers.length || '-'})</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Subdomain</div>
                    <div className="flex gap-2">
                      <Input 
                        value={subdomainInput} 
                        onChange={(e) => setSubdomainInput(e.target.value)} 
                        className="h-8 text-sm"
                        placeholder="subdomain"
                      />
                      <Button 
                        size="sm" 
                        className="h-8" 
                        onClick={handleUpdateSubdomain} 
                        disabled={isUpdatingSubdomain || subdomainInput.trim() === selectedTenant.subdomain}
                      >
                        {isUpdatingSubdomain ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created Date</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{new Date(selectedTenant.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Subscription & Status</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-500 uppercase">Plan Tier</label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={selectedTenant.subscription?.planType || 'FREE'}
                        onChange={(e) => handleUpdateSubscription(selectedTenant.id, e.target.value, selectedTenant.subscription?.status || 'ACTIVE')}
                      >
                        <option value="FREE">Free Tier</option>
                        <option value="PRO">Pro Tier</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-500 uppercase">Account Status</label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={selectedTenant.subscription?.status || 'ACTIVE'}
                        onChange={(e) => handleUpdateSubscription(selectedTenant.id, selectedTenant.subscription?.planType || 'FREE', e.target.value)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="PAST_DUE">Past Due</option>
                      </select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="members" className="pt-4">
                <div className="mb-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3">Add Member</h4>
                  <div className="flex gap-2">
                    <input type="email" placeholder="Email Address" className="flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" id="newMemberEmail" />
                    <select className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" id="newMemberRole">
                      {systemRoles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    <Button size="sm" onClick={() => {
                       const email = (document.getElementById('newMemberEmail') as HTMLInputElement).value;
                       const role = (document.getElementById('newMemberRole') as HTMLSelectElement).value;
                       if (email && selectedTenant) handleAddMember(selectedTenant.id, email, role);
                    }}>Add</Button>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">User</th>
                        <th className="px-4 py-3 text-left font-medium">Role</th>
                        <th className="px-4 py-3 text-right font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {isMembersLoading ? (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Loading members...</td></tr>
                      ) : tenantMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{member.userProfile?.email || 'Unknown User'}</div>
                            <div className="text-xs text-gray-500">{member.userId.substring(0,8)}...</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={member.isOwner ? 'default' : 'secondary'} className="text-[10px] py-0">
                              {member.isOwner ? 'OWNER' : (member.customRole?.name || 'MEMBER')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {member.userProfile?.globalRole === 'SUPER_ADMIN' ? (
                              <Badge variant="outline" className="mr-2 border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400 font-normal py-1">Super Admin</Badge>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-8 mr-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40" onClick={() => handleMakeSuperAdmin(member.userId)}>
                                Make Super Admin
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDeleteMember(member.userId)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="pt-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                  <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Impersonate Tenant</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Temporarily view the application exactly as this tenant sees it.
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      className="shrink-0 font-medium"
                      onClick={() => {
                        const protocol = window.location.protocol;
                        const hostparts = window.location.host.split('.');
                        const rootDomain = hostparts.length > 2 ? hostparts.slice(1).join('.') : hostparts.join('.');
                        window.open(`${protocol}//${selectedTenant.subdomain}.${rootDomain}/dashboard`, '_blank');
                      }}
                    >
                      Log in as Tenant
                    </Button>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-800 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-red-600 dark:text-red-500">Delete Workspace</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Permanently delete this workspace and all associated data.
                      </p>
                    </div>
                    <Button variant="destructive" className="shrink-0 font-medium" onClick={handleDeleteTenant}>
                      Delete Workspace
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
