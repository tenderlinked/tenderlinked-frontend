"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Download, Plus, ClipboardList, Banknote, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface Tenant {
  id: string;
  name: string;
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

  if (status === "loading") {
    return <div className="p-12 text-center">Loading admin console...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Superadmin Console
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitoring global procurement ecosystems & tenant health.
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-100 dark:border-gray-800">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Tenants</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{tenants.length || "1,284"}</h2>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+12%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 dark:border-gray-800">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Subs</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tenants.filter(t => t.subscription?.status === 'ACTIVE').length || "942"}
                </h2>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Pro/Ent</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 dark:border-gray-800">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform MRR</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">$2.4M</h2>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">USD</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 dark:border-gray-800">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Global Tenders</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">45.2k</h2>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Live</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Revenue Mix Placeholder */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b bg-white dark:bg-gray-950 pb-4 pt-5 px-6 rounded-t-lg flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-gray-900 dark:text-white">Revenue Mix</CardTitle>
          <div className="flex gap-4 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"></div> Enterprise</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Pro</div>
          </div>
        </CardHeader>
        <CardContent className="p-6 h-64 flex flex-col justify-end">
          {/* Faked Chart Axes */}
          <div className="flex justify-between text-xs text-gray-400 font-medium px-4">
            <span>SEP</span>
            <span>OCT</span>
            <span>NOV</span>
            <span>DEC</span>
            <span>JAN</span>
            <span>FEB</span>
            <span>MAR</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
