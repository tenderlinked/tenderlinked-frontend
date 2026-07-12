"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, Trash2, Mail, Users, Building, Plus, Settings } from "lucide-react";
import toast from "react-hot-toast";

interface Member {
  id: string;
  userId: string;
  role: string;
  userProfile: {
    userId: string;
    phoneNumber: string | null;
    companyName: string | null;
  } | null;
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");

  // @ts-ignore
  const tenantId = session?.user?.tenantSubdomain as string || "default";
  
  const [actualTenantId, setActualTenantId] = useState<string | null>(null);

  useEffect(() => {
    console.log("Settings Session Status:", status);
    console.log("Settings Session Data:", session);
    
    if (status === "loading") return; // Wait for session to load before redirecting
    
    if (status === "unauthenticated") {
      window.location.href = "/auth/login";
      return;
    }
    
    if (session?.user) {
      console.log("Session User ID:", session.user.id);
      fetchTenantId();
    }
  }, [session, status]);

  const fetchTenantId = async () => {
    try {
      // If we don't have an ID but have an email, we could theoretically lookup by email.
      // For now, let's assume session.user.id is required.
      if (!session?.user?.id) {
         console.warn("User ID is missing from session!");
         setLoading(false);
         return;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/users/profile/${session?.user?.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tenant) {
          setActualTenantId(data.tenant.id);
          fetchMembers(data.tenant.id);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchMembers = async (tid: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/tenants/${tid}/members`, {
        headers: {
          'x-user-id': session?.user?.id || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("Invite functionality requires email service integration (SaaS Feature Stub)");
  };

  const handleRemove = async (userId: string) => {
    if (!actualTenantId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/tenants/${actualTenantId}/members/${userId}`, {
        method: "DELETE",
        headers: {
          'x-user-id': session?.user?.id || ''
        }
      });
      if (res.ok) {
        toast.success("Member removed");
        fetchMembers(actualTenantId);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to remove member");
      }
    } catch (error) {
      toast.error("Error removing member");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage your team and billing settings for {tenantId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Team Members */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" /> Team Members
                  </CardTitle>
                  <CardDescription className="mt-1">Manage who has access to your workspace.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No members found.</div>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                            {member.userId.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {member.userId === session?.user?.id ? "You" : `User ID: ${member.userId.substring(0,8)}...`}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {member.userProfile?.companyName || "No Company"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'} className={member.role === 'OWNER' ? 'bg-blue-600' : ''}>
                          {member.role === 'OWNER' ? <Shield className="w-3 h-3 mr-1" /> : null}
                          {member.role}
                        </Badge>
                        {member.userId !== session?.user?.id && (
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemove(member.userId)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Invite Card */}
          <Card className="shadow-sm border-blue-100 dark:border-blue-900">
            <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" /> Invite Member
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="colleague@company.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Send Invite
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" /> Billing Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Plan</span>
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                    {/* Ideally fetch the subscription here, but we rely on nextAuth session for simplicity */}
                    {/* @ts-ignore */}
                    {session?.user?.hasActivePlan ? 'Pro' : 'Trial / Basic'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="w-full text-xs h-8" onClick={() => window.location.href='/pricing'}>
                    Manage Plan
                  </Button>
                  <Button variant="outline" className="w-full text-xs h-8" onClick={() => window.location.href='/settings/credits'}>
                    View History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
