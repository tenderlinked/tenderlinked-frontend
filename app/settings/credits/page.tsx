"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

interface CreditTransaction {
  id: string;
  amount: number;
  description: string;
  tenderId: string | null;
  createdAt: string;
}

export default function CreditsHistoryPage() {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/auth/login";
      return;
    }

    if (status === "authenticated" && session) {
      fetchHistory();
    }
  }, [session, status]);

  const fetchHistory = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = (session as any)?.accessToken;
      
      if (!token) return;

      const res = await fetch(`${apiUrl}/api/billing/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch credit history:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Credit Usage History</h1>
        <p className="text-slate-500 mt-2 text-lg">View your recent credit transactions and deductions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>A complete log of all credit activity for your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center text-slate-500">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <FileText className="h-10 w-10 text-slate-300 mb-4" />
              <p className="font-medium text-slate-600">No transactions found</p>
              <p className="text-sm mt-1">You haven't used any credits yet.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium text-slate-700">
                        {format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {tx.description}
                        {tx.tenderId && <span className="ml-2 text-xs text-slate-400 font-mono">{tx.tenderId.split('-')[0]}...</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`inline-flex items-center gap-1 font-semibold ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.amount < 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          {Math.abs(tx.amount)} {Math.abs(tx.amount) === 1 ? 'Credit' : 'Credits'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
