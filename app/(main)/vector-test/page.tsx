'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Cpu, CheckCircle2, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

interface VectorScore {
  category: string;
  similarity: number;
  percentage: number;
}

interface TestResult {
  bestCategory: string;
  confidence: number;
  workType: string | null;
  tags: string[];
  scores: VectorScore[];
}

const PRESET_SAMPLES = [
  {
    label: "Safety Wear & PPE",
    title: "Supply of Safety Jackets and Anti dust goggles",
    description: "Procurement of high visibility reflective safety vests and protective anti-dust safety goggles for mining staff."
  },
  {
    label: "Civil Infrastructure",
    title: "Construction of 2-lane High Level Bridge over Mahanadi River",
    description: "Civil structural work including concrete pile foundation, piers, and asphalt road approach."
  },
  {
    label: "IT & Hardware",
    title: "Procurement of 100 Desktop Computers, Laptops & Multifunction Printers",
    description: "Supply of Intel Core i7 desktop PCs, Windows 11 laptops, and high speed laser network printers for head office."
  },
  {
    label: "Solar Energy",
    title: "Supply, Installation and Commissioning of 500KW On-Grid Solar PV Power Plant",
    description: "Roof top solar panel installation, inverter cabling, net metering, and 5 years operation and maintenance."
  },
  {
    label: "Security Services",
    title: "Hiring of 50 Security Guards and Supervisors for Office Premises",
    description: "Deployment of trained security personnel and ex-servicemen for round-the-clock watch and ward duty."
  }
];

export default function VectorTestPage() {
  const [title, setTitle] = useState("Supply of Safety Jackets and Anti dust goggles");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllScores, setShowAllScores] = useState(false);

  const handleTest = async (testTitle = title, testDesc = description) => {
    if (!testTitle.trim()) return;
    setLoading(true);
    setError(null);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${backendUrl}/api/tenders/test-vector-categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: testTitle, description: testDesc }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run vector categorization test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Vector Semantic Search & Categorization Tester
            </h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-semibold text-xs">
              Local 384-dim AI Vector Engine
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Test how <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 text-xs">@xenova/transformers</code> matches any tender text against 44 standard industry categories in vector space without manual rules.
          </p>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Quick Test Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_SAMPLES.map((sample, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-xs font-medium border-slate-200 shadow-sm transition-all"
              onClick={() => {
                setTitle(sample.title);
                setDescription(sample.description);
                handleTest(sample.title, sample.description);
              }}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
              {sample.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center justify-between">
            <span>Input Tender Details</span>
            <span className="text-xs text-slate-400 font-normal">Zero API fees • Fast CPU Inference</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tender Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Supply of Safety Jackets and Anti dust goggles"
              className="h-11 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Description / BOQ Summary (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional work details or scope of supply..."
              className="min-h-[90px] text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={() => handleTest()}
              disabled={loading || !title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vectorizing & Matching...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 mr-2" /> Run Vector Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Winning Category Summary Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Predicted Category
                </span>
                <h2 className="text-3xl font-black text-white mt-1 tracking-tight">
                  {result.bestCategory}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 border border-blue-400/30 px-4 py-2 rounded-xl text-center">
                  <div className="text-2xl font-extrabold text-blue-300">{result.confidence}%</div>
                  <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Similarity Score</div>
                </div>
                {result.workType && (
                  <div className="bg-emerald-500/20 border border-emerald-400/30 px-4 py-2 rounded-xl text-center">
                    <div className="text-2xl font-extrabold text-emerald-300">{result.workType}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Work Type</div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Generated Search Tags:</span>
              {result.tags.map((tag, i) => (
                <Badge key={i} className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 px-3 py-1 font-medium">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Full Vector Breakdown List */}
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  Category Vector Similarity Ranking
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dot product similarity between tender vector and 384-dim category vectors
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-blue-600 hover:bg-blue-50"
                onClick={() => setShowAllScores(!showAllScores)}
              >
                {showAllScores ? "Show Top Matches Only" : `Show All 44 Categories`}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {(showAllScores ? result.scores : result.scores.slice(0, 10)).map((item, idx) => {
                const isWinner = item.category === result.bestCategory;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isWinner
                        ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm font-semibold mb-1.5">
                      <span className={`flex items-center gap-2 ${isWinner ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                        {idx + 1}. {item.category}
                        {isWinner && (
                          <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0">
                            Winner
                          </Badge>
                        )}
                      </span>
                      <span className={`font-mono text-xs ${isWinner ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                        {(item.similarity * 100).toFixed(1)}% ({item.similarity})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isWinner
                            ? 'bg-blue-600'
                            : item.percentage > 35
                            ? 'bg-emerald-500'
                            : item.percentage > 20
                            ? 'bg-amber-400'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
