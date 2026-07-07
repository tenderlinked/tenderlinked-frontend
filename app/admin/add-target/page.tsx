"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Play, Server, Map, Globe } from "lucide-react";
import toast from "react-hot-toast";

interface RegionDistrict {
  id: string;
  name: string;
}

interface RegionState {
  id: string;
  name: string;
  districts: RegionDistrict[];
}

export default function AddTargetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [regions, setRegions] = useState<RegionState[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [type, setType] = useState<"STATE" | "DISTRICT">("STATE");
  const [name, setName] = useState("");
  const [stateName, setStateName] = useState("Odisha");
  const [districtId, setDistrictId] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAndRunning, setIsSubmittingAndRunning] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRegions();
    }
  }, [status]);

  // Auto-detect / Auto-populate URL
  useEffect(() => {
    const stateObj = regions.find(s => s.name === stateName);
    if (type === 'STATE' && stateObj) {
      const formatted = stateObj.name.replace(/[\s-]/g, '').toLowerCase();
      // Most NICGEP state portals follow this or similar, user can edit if wrong
      setUrl(`https://tenders${formatted}.gov.in/nicgep/app`);
    } else if (type === 'DISTRICT' && districtId && stateObj) {
      const districtObj = stateObj.districts.find(d => d.id === districtId);
      if (districtObj) {
        const formatted = districtObj.name.replace(/[\s-]/g, '').toLowerCase();
        // Standard S3WaaS district pattern
        setUrl(`https://${formatted}.nic.in/en/tender`);
      }
    } else {
      setUrl("");
    }
  }, [type, stateName, districtId, regions]);

  const getHeaders = (): Record<string, string> => {
    // @ts-ignore
    const token = session?.accessToken;
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const fetchRegions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/states`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRegions(data);
        if (data.length > 0) setStateName(data[0].name);
      }
    } catch (e) {
      toast.error("Failed to load regions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (runImmediately: boolean) => {
    if (!name.trim() && type === 'STATE') {
      toast.error("Name is required");
      return;
    }
    if (type === 'DISTRICT' && !districtId) {
      toast.error("Please select a district");
      return;
    }
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }

    try {
      runImmediately ? setIsSubmittingAndRunning(true) : setIsSubmitting(true);
      
      const stateObj = regions.find(s => s.name === stateName);
      let districtObj = undefined;
      let finalName = name;
      
      if (type === 'DISTRICT') {
        districtObj = stateObj?.districts.find(d => d.id === districtId);
        finalName = `${districtObj?.name} District`;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          name: finalName, 
          type, 
          state: stateName, 
          url,
          regionStateId: stateObj?.id,
          regionDistrictId: districtObj?.id
        })
      });
      
      if (res.ok) {
        const newTarget = await res.json();
        toast.success("Target added successfully!");

        if (runImmediately) {
          toast.loading("Starting scraper...", { id: "run-scrape" });
          const scrapeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scrape`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ targetIds: [newTarget.id] })
          });
          
          if (scrapeRes.ok) {
            toast.success("Scraper successfully enqueued!", { id: "run-scrape" });
            router.push('/admin/scraper-instances');
          } else {
            toast.error("Failed to run scraper", { id: "run-scrape" });
          }
        } else {
          // Reset form
          setName("");
          setUrl("");
          setDistrictId("");
          router.push('/admin/scraper-targets');
        }
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to add target");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
      setIsSubmittingAndRunning(false);
    }
  };

  const selectedStateObj = regions.find(s => s.name === stateName);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Server className="w-8 h-8 text-primary" />
          Add Scraper Target
        </h1>
        <p className="text-muted-foreground mt-2">
          Add a new state or district e-procurement portal to your tracking list and start scraping immediately.
        </p>
      </div>

      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>Target Details</CardTitle>
          <CardDescription>Configure the endpoint you want to monitor for new tenders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Type</label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={type === "STATE" ? "default" : "outline"}
                onClick={() => setType("STATE")}
                className="h-12 justify-start px-4"
              >
                <Globe className="w-5 h-5 mr-2" />
                State Portal (NICGEP)
              </Button>
              <Button
                variant={type === "DISTRICT" ? "default" : "outline"}
                onClick={() => setType("DISTRICT")}
                className="h-12 justify-start px-4"
              >
                <Map className="w-5 h-5 mr-2" />
                District Portal (S3WaaS)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={stateName} 
                onChange={e => {
                  setStateName(e.target.value);
                  setDistrictId("");
                }}
              >
                {regions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            {type === 'STATE' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Name</label>
                <Input 
                  placeholder="e.g. Odisha State Tenders" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select District</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={districtId} 
                  onChange={e => setDistrictId(e.target.value)}
                >
                  <option value="">-- Select a District --</option>
                  {selectedStateObj?.districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Portal URL</label>
            <Input 
              placeholder={type === 'STATE' ? "https://tendersodisha.gov.in/nicgep/app" : "https://sambalpur.nic.in/en/tender"} 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ensure you enter the direct URL to the tenders listing table.
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/10 border-t py-4 flex flex-col sm:flex-row gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)} 
            disabled={isSubmitting || isSubmittingAndRunning}
            className="w-full sm:w-auto bg-white hover:bg-gray-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Save to List Only
          </Button>
          <Button 
            onClick={() => handleSave(true)} 
            disabled={isSubmitting || isSubmittingAndRunning}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmittingAndRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Save & Run Scraper Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
