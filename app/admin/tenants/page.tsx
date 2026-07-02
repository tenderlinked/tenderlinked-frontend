"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Plus, Filter, Users, ShieldAlert, LogIn, Trash2, Building, Activity, CreditCard } from "lucide-react";
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

  useEffect(() => {
    if (status === "authenticated") {
      fetchTenants();
    }
  }, [status]);

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
                  <th className="px-6 py-4 font-semibold">Organization</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Admin</th>
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
                    <tr key={tenant.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors bg-white dark:bg-gray-950">
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
                        admin@{tenant.subdomain}.com
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

              <TabsContent value="overview" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Workspace Details</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3 border">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Building className="w-4 h-4" /> Subdomain</span>
                        <span className="font-medium">{selectedTenant.subdomain}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Activity className="w-4 h-4" /> Created</span>
                        <span className="font-medium">{new Date(selectedTenant.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2"><Users className="w-4 h-4" /> Total Users</span>
                        <span className="font-medium">{selectedTenant._count.members} users</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Subscription & Billing</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4 border">
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
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs uppercase border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">User</th>
                        <th className="px-4 py-3 text-left font-medium">Role</th>
                        <th className="px-4 py-3 text-right font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {isMembersLoading ? (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Loading members...</td></tr>
                      ) : tenantMembers.map((member) => (
                        <tr key={member.id} className="bg-white dark:bg-gray-950">
                          <td className="px-4 py-3">
                            <div className="font-medium">{member.userProfile?.email || 'Unknown User'}</div>
                            <div className="text-xs text-gray-500">{member.userId.substring(0,8)}...</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'} className="text-[10px] py-0">{member.role}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteMember(member.userId)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg mt-0.5">
                        <LogIn className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Impersonation</h4>
                        <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1 mb-3">
                          Temporarily view the application exactly as this tenant sees it.
                        </p>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
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
                    </div>
                  </div>

                  <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg mt-0.5">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-red-900 dark:text-red-100">Danger Zone</h4>
                        <p className="text-sm text-red-700/80 dark:text-red-300/80 mt-1 mb-3">
                          Permanently delete this workspace and all associated data. This action is irreversible.
                        </p>
                        <Button variant="destructive" size="sm" onClick={handleDeleteTenant}>
                          Delete Workspace
                        </Button>
                      </div>
                    </div>
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
