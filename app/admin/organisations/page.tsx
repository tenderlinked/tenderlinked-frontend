"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

interface OrgMapping {
  id: string;
  rawName: string;
  normalizedName: string | null;
  isMapped: boolean;
  state: string;
}

export default function OrganisationsAdminPage() {
  const { data: session } = useSession();
  const [mappings, setMappings] = useState<OrgMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "mapped">("pending");
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMappings(data);
    } catch (e) {
      toast.error("Failed to load organisations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((session as any)?.accessToken) {
      fetchMappings();
    }
  }, [session]);

  const handleUpdate = async (id: string, currentNormalized: string | null) => {
    const val = editValues[id] || currentNormalized || "";
    if (!val.trim()) {
      toast.error("Normalized name cannot be empty");
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ normalizedName: val })
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Mapping updated!");
      fetchMappings();
    } catch (e) {
      toast.error("Failed to update mapping");
    }
  };

  const filtered = mappings.filter(m => (tab === "pending" ? !m.isMapped : m.isMapped));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Organisation Dictionary</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Organisation Normalization</CardTitle>
          <div className="flex space-x-4 mt-4">
            <Button variant={tab === "pending" ? "default" : "outline"} onClick={() => setTab("pending")}>
              Pending Review ({mappings.filter(m => !m.isMapped).length})
            </Button>
            <Button variant={tab === "mapped" ? "default" : "outline"} onClick={() => setTab("mapped")}>
              Mapped ({mappings.filter(m => m.isMapped).length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raw Name</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Normalized Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm max-w-xs truncate" title={m.rawName}>
                      {m.rawName}
                    </TableCell>
                    <TableCell>{m.state}</TableCell>
                    <TableCell>
                      {m.isMapped ? <Badge className="bg-green-500">Mapped</Badge> : <Badge variant="destructive">Pending</Badge>}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editValues[m.id] !== undefined ? editValues[m.id] : m.normalizedName || ""}
                        onChange={e => setEditValues({ ...editValues, [m.id]: e.target.value })}
                        placeholder="Enter normalized name..."
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleUpdate(m.id, m.normalizedName)}>Save</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No organisations found in this tab.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
