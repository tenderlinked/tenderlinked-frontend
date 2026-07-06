import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface PreviewTenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: { id: string; name: string; url: string; type: string; state?: string } | null;
  token?: string;
  onUpdateSuccess?: () => void;
}

export function PreviewTenderDialog({ open, onOpenChange, target, token, onUpdateSuccess }: PreviewTenderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tenders, setTenders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ url: string; oldPattern: string; newPattern: string; extractedFromArchive?: boolean } | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open && target) {
      setLoading(true);
      setError(null);
      setTenders([]);
      setSuggestion(null);

      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/preview?url=${encodeURIComponent(target.url)}&type=${target.type}&name=${encodeURIComponent(target.name)}`;
      
      fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTenders(data.tenders || []);
          if (data.suggestedUrl) {
            setSuggestion({
              url: data.suggestedUrl,
              oldPattern: data.suggestedOldPattern,
              newPattern: data.suggestedNewPattern,
              extractedFromArchive: data.extractedFromArchive
            });
          }
        } else {
          setError(data.reason || "Failed to parse tenders.");
        }
      })
      .catch(err => {
        setError("Network error while trying to preview.");
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [open, target, token]);

  const handleBulkUpdate = async () => {
    if (!target?.state || !suggestion) return;
    
    setUpdating(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/bulk-update-state-urls`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          state: target.state,
          oldPattern: suggestion.oldPattern,
          newPattern: suggestion.newPattern
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully updated ${data.updatedCount} districts in ${target.state}!`);
        if (onUpdateSuccess) onUpdateSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.reason || "Failed to bulk update");
      }
    } catch (e) {
      toast.error("Network error during bulk update");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Preview Extraction: {target?.name}</DialogTitle>
          <DialogDescription>
            Live test scraping <strong>{target?.url}</strong> to verify template compatibility.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p>Analyzing HTML and running parsers...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4" />
                <h5 className="font-medium leading-none tracking-tight">Extraction Failed</h5>
              </div>
              <div className="text-sm opacity-90 pl-6">{error}</div>
            </div>
          ) : tenders.length === 0 ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4" />
                <h5 className="font-medium leading-none tracking-tight">No Data Extracted</h5>
              </div>
              <div className="text-sm opacity-90 pl-6">The parser ran successfully but found 0 tenders. The website might be empty, or the template has changed.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestion && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h5 className="font-semibold mb-1">
                        {suggestion.url === target?.url ? "Format is correct!" : "Found working URL!"}
                      </h5>
                      <p className="text-sm opacity-90">
                        {suggestion.extractedFromArchive 
                           ? "We couldn't find active tenders, but we verified your format using past/archive data:"
                           : "We checked fallbacks and verified this format:"} <br/> 
                        <strong className="break-all">{suggestion.url}</strong>
                      </p>
                    </div>
                    <Button onClick={handleBulkUpdate} disabled={updating} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                      {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      {suggestion.url === target?.url ? `Verify all ${target?.state} districts` : `Update all ${target?.state} districts`}
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Parser Compatible</Badge>
                <span className="text-sm text-muted-foreground">Successfully extracted {tenders.length} tenders.</span>
              </div>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Title / Description</th>
                      <th className="px-4 py-3 font-medium">Published Date</th>
                      <th className="px-4 py-3 font-medium">Closing Date</th>
                      <th className="px-4 py-3 font-medium">Opening Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tenders.map((t, idx) => {
                      const formatDate = (dateStr: any) => {
                        if (!dateStr) return 'N/A';
                        if (typeof dateStr === 'string' && (dateStr.includes('AM') || dateStr.includes('PM'))) {
                          return dateStr; // Preserve raw NICGEP string like "13-Jul-2026 03:00 PM"
                        }
                        const d = new Date(dateStr);
                        return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleString();
                      };
                      return (
                        <tr key={idx} className="bg-card hover:bg-muted/50">
                          <td className="px-4 py-3 max-w-[200px] md:max-w-sm truncate" title={t.title}>{t.title}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.startDate)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-red-600 dark:text-red-400">{formatDate(t.endDate)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-blue-600 dark:text-blue-400">{formatDate(t.openingDate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
