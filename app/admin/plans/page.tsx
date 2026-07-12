"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Edit, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";

// The full list of potentially gateable fields
const GATEABLE_FIELDS = [
  { id: 'tenderValue', label: 'Tender Value (₹)' },
  { id: 'emd', label: 'EMD Amount' },
  { id: 'applicationCost', label: 'Application Cost' },
  { id: 'aiSummary', label: 'AI Summary' },
  { id: 'tags', label: 'Tags & Keywords' },
  { id: 'noticePdfUrl', label: 'Notice PDF' },
  { id: 'tenderPdfUrl', label: 'Tender PDF Document' },
];

export default function PricingPlansPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit State
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/plans`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) fetchPlans();
  }, [session?.accessToken]);

  const handleSave = async () => {
    if (!editingPlan?.name) return toast.error('Name is required');

    try {
      const url = editingPlan.id 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/plans/${editingPlan.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/plans`;
      
      const res = await fetch(url, {
        method: editingPlan.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          name: editingPlan.name,
          price: Number(editingPlan.price) || 0,
          isDefault: editingPlan.isDefault || false,
          allowedTenderFields: editingPlan.allowedTenderFields || [],
          monthlyCredits: editingPlan.monthlyCredits || 0,
          maxKeywords: editingPlan.maxKeywords || 3,
          maxStates: editingPlan.maxStates || 1,
          maxTenderViews: editingPlan.maxTenderViews || 50,
          hasEmailAlerts: editingPlan.hasEmailAlerts || false,
          hasWhatsappAlerts: editingPlan.hasWhatsappAlerts || false,
          hasSmsAlerts: editingPlan.hasSmsAlerts || false,
          freeRedownloads: editingPlan.freeRedownloads ?? 3,
        })
      });

      if (res.ok) {
        toast.success(`Plan ${editingPlan.id ? 'updated' : 'created'} successfully!`);
        setEditingPlan(null);
        fetchPlans();
      } else {
        toast.error('Failed to save plan');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (res.ok) {
        toast.success('Plan deleted');
        fetchPlans();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleField = (fieldId: string) => {
    const current = editingPlan.allowedTenderFields || [];
    const updated = current.includes(fieldId) 
      ? current.filter((f: string) => f !== fieldId)
      : [...current, fieldId];
    
    setEditingPlan({ ...editingPlan, allowedTenderFields: updated });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Subscription Plans</h1>
          <p className="text-gray-500 mt-1">Manage pricing tiers and their content access limits.</p>
        </div>
        <Button onClick={() => setEditingPlan({ 
          name: '', price: 0, allowedTenderFields: [], isDefault: false,
          monthlyCredits: 0, maxKeywords: 3, maxStates: 1, maxTenderViews: 50,
          hasEmailAlerts: false, hasWhatsappAlerts: false, hasSmsAlerts: false
        })}>
          <Plus className="w-4 h-4 mr-2" /> Create Plan
        </Button>
      </div>

      {editingPlan && (
        <Card className="border-blue-200 shadow-md">
          <CardHeader>
            <CardTitle>{editingPlan.id ? 'Edit Plan' : 'Create New Plan'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Plan Name</label>
                <Input value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} placeholder="e.g. PRO" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Monthly Price (₹)</label>
                <Input type="number" value={editingPlan.price} onChange={e => setEditingPlan({...editingPlan, price: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Monthly Credits</label>
                <Input type="number" value={editingPlan.monthlyCredits} onChange={e => setEditingPlan({...editingPlan, monthlyCredits: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Tender Views</label>
                <Input type="number" value={editingPlan.maxTenderViews} onChange={e => setEditingPlan({...editingPlan, maxTenderViews: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Keywords</label>
                <Input type="number" value={editingPlan.maxKeywords} onChange={e => setEditingPlan({...editingPlan, maxKeywords: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max States</label>
                <Input type="number" value={editingPlan.maxStates} onChange={e => setEditingPlan({...editingPlan, maxStates: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Free Redownloads</label>
                <Input type="number" value={editingPlan.freeRedownloads ?? 3} onChange={e => setEditingPlan({...editingPlan, freeRedownloads: parseInt(e.target.value)})} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Alert Channels</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editingPlan.hasEmailAlerts} onChange={e => setEditingPlan({...editingPlan, hasEmailAlerts: e.target.checked})} className="rounded" />
                  Email Alerts
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editingPlan.hasWhatsappAlerts} onChange={e => setEditingPlan({...editingPlan, hasWhatsappAlerts: e.target.checked})} className="rounded" />
                  WhatsApp Alerts
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editingPlan.hasSmsAlerts} onChange={e => setEditingPlan({...editingPlan, hasSmsAlerts: e.target.checked})} className="rounded" />
                  SMS Alerts
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Allowed Premium Content Fields</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {GATEABLE_FIELDS.map(field => {
                  const isChecked = (editingPlan.allowedTenderFields || []).includes(field.id);
                  return (
                    <div 
                      key={field.id}
                      onClick={() => toggleField(field.id)}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-gray-50/50 border-gray-200 hover:bg-gray-100'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${isChecked ? 'bg-blue-600' : 'bg-white border border-gray-300'}`}>
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{field.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={() => setEditingPlan(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save Plan</Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="relative overflow-hidden group">
            {plan.isDefault && <div className="absolute top-0 inset-x-0 h-1 bg-green-500" />}
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{plan.name}</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{plan.price || 0}</span>
              </CardTitle>
              {plan.isDefault && <Badge variant="secondary" className="w-fit">Default Sign-up Plan</Badge>}
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Limits</h4>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>Credits: <b>{plan.monthlyCredits || 0}</b></div>
                <div>Views: <b>{plan.maxTenderViews || 0}</b></div>
                <div>Keywords: <b>{plan.maxKeywords || 0}</b></div>
                <div>States: <b>{plan.maxStates || 0}</b></div>
                <div className="col-span-2">Free Redownloads: <b>{plan.freeRedownloads ?? 3}</b></div>
              </div>
              <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Alerts</h4>
              <div className="flex gap-2 text-xs mb-4">
                {plan.hasEmailAlerts && <Badge variant="outline">Email</Badge>}
                {plan.hasWhatsappAlerts && <Badge variant="outline">WhatsApp</Badge>}
                {plan.hasSmsAlerts && <Badge variant="outline">SMS</Badge>}
              </div>

              <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Features Included</h4>
              <ul className="space-y-2">
                {GATEABLE_FIELDS.map(field => {
                  const isIncluded = plan.allowedTenderFields.includes(field.id);
                  return (
                    <li key={field.id} className={`flex items-center text-sm ${isIncluded ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                      {isIncluded ? <Check className="w-4 h-4 text-green-500 mr-2" /> : <div className="w-4 h-4 mr-2" />}
                      {field.label}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
            <CardFooter className="border-t bg-gray-50/50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="outline" onClick={() => setEditingPlan(plan)}><Edit className="w-3 h-3 mr-1" /> Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(plan.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
