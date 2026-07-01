// Touch file to trigger rebuild
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Settings, Users, ArrowRight, ShieldCheck, Search } from "lucide-react";
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

export default function SuperAdminPage() {
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
      const res = await fetch("http://localhost:3001/api/tenants");
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
      const res = await fetch(`http://localhost:3001/api/tenants/${tenantId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    return <div className="p-12 text-center">Loading admin panel...</div>;
  }

  // Basic guard (In real app, backend checks a global SUPER_ADMIN role)
  // Since we haven't built complex RBAC for the Super Admin, we just show it for authenticated users for demo purposes.

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 pt-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-blue-600" /> Super Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage all SaaS Tenants and Subscriptions globally.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm border-t-4 border-t-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-t-4 border-t-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {tenants.filter(t => t.subscription?.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-800/50 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Server className="w-5 h-5 text-gray-700 dark:text-gray-300" /> Tenants Directory
              </CardTitle>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search tenants..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b">
                <tr>
                  <th className="px-6 py-4">Tenant Name</th>
                  <th className="px-6 py-4">Subdomain</th>
                  <th className="px-6 py-4">Members</th>
                  <th className="px-6 py-4">Plan & Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading tenants...</td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No tenants found.</td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {tenant.name}
                        <div className="text-xs text-gray-500 mt-1">Created {new Date(tenant.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono bg-blue-50/50 text-blue-700 border-blue-200">
                          {tenant.subdomain}.localhost:3000
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" /> {tenant._count.members}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.subscription ? (
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant={tenant.subscription.planType === 'professional' ? 'default' : 'secondary'} className="capitalize">
                              {tenant.subscription.planType}
                            </Badge>
                            <Badge variant={tenant.subscription.status === 'ACTIVE' ? 'outline' : 'secondary'} className={tenant.subscription.status === 'ACTIVE' ? 'text-emerald-600 border-emerald-500' : ''}>
                              {tenant.subscription.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No Subscription</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {tenant.subscription?.status === 'ACTIVE' ? (
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateSubscription(tenant.id, tenant.subscription!.planType, 'CANCELLED')}>
                              Cancel Plan
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleUpdateSubscription(tenant.id, 'professional', 'ACTIVE')}>
                              Activate Pro
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => window.open(`http://${tenant.subdomain}.localhost:3000/dashboard`, '_blank')}>
                            Login As <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
