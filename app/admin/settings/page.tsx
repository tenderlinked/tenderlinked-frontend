"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smsProvider, setSmsProvider] = useState<string>("MSG91");

  useEffect(() => {
    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSmsProvider(data.smsProvider || "MSG91");
      } else {
        toast.error("Failed to load settings");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error while loading settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ smsProvider })
      });
      if (res.ok) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error while saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-2">Manage global configurations for the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMS Gateway Provider</CardTitle>
          <CardDescription>
            Select the active provider for sending OTPs across the platform. Ensure environment variables are configured for the selected provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={smsProvider} 
            onValueChange={setSmsProvider}
            className="flex flex-col space-y-4 mt-4"
          >
            <div className="flex items-center space-x-3 border p-4 rounded-md">
              <RadioGroupItem value="MSG91" id="msg91" />
              <Label htmlFor="msg91" className="flex flex-col cursor-pointer flex-1">
                <span className="font-semibold text-base">MSG91</span>
                <span className="text-sm text-muted-foreground font-normal">Use MSG91 DLT-compliant OTP routes (India primarily).</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 border p-4 rounded-md">
              <RadioGroupItem value="TWILIO" id="twilio" />
              <Label htmlFor="twilio" className="flex flex-col cursor-pointer flex-1">
                <span className="font-semibold text-base">Twilio Verify API</span>
                <span className="text-sm text-muted-foreground font-normal">Use Twilio for global OTP delivery. Requires TWILIO_VERIFY_SERVICE_SID.</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter className="bg-muted/30 pt-6">
          <Button onClick={handleSave} disabled={saving} className="ml-auto">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
