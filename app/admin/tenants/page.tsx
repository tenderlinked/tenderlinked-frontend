"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
                            tenant.subscription?.status === 'ACTIVE' 
                              ? 'bg-emerald-500' 
                              : tenant.subscription?.status === 'SUSPENDED' 
                                ? 'bg-red-500' 
                                : 'bg-gray-400'
                          }`}></div>
                          <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {tenant.subscription?.status?.toLowerCase() || 'pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">
                        admin@{tenant.subdomain}.com
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="link" className="font-semibold text-sm">
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
    </div>
  );
}
