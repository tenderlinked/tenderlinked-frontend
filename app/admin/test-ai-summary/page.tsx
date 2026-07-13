"use client";

import { useState } from "react";
import { Upload, FileType, CheckCircle, AlertCircle, FileText, Download, Eye } from "lucide-react";

export default function TestAiSummaryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"vision" | "text">("vision");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/generate-ai-summary?mode=${mode}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Try to parse error json if possible
        let errorMsg = "Failed to generate AI Summary";
        try {
           const errData = await response.json();
           if (errData.message) errorMsg = errData.message;
        } catch(e) {}
        throw new Error(errorMsg);
      }

      // Read as blob since the response is a PDF file
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full font-sans">
      <div className="mb-8 w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <FileText className="h-8 w-8 text-indigo-600" />
          AI Tender Summary Generator
        </h1>
        <p className="text-gray-500">
          Upload a <code>.zip</code> file containing tender documents (PDFs) to test the Gemini AI extraction and PDF generation.
        </p>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Configuration & Upload Section */}
        <div className="w-full max-w-xl mx-auto bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Configure & Upload</h2>
          
          <div className="flex flex-col gap-5">
            {/* Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Extraction Mode</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setMode("vision")}
                  className={`relative flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium border ${
                    mode === "vision"
                      ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  } rounded-l-md`}
                >
                  <Eye className={`mr-2 h-4 w-4 ${mode === "vision" ? "text-indigo-500" : "text-gray-400"}`} />
                  Vision (High Accuracy)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className={`relative flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-l-0 ${
                    mode === "text"
                      ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  } rounded-r-md`}
                >
                  <FileText className={`mr-2 h-4 w-4 ${mode === "text" ? "text-indigo-500" : "text-gray-400"}`} />
                  Text (Low Token Cost)
                </button>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors mt-2">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileType className="w-8 h-8 mb-2 text-gray-500" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">.ZIP files only</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".zip,.rar" 
                onChange={handleFileChange}
              />
            </label>

            {file && (
              <div className="flex items-center gap-2 text-sm p-3 bg-indigo-50 text-indigo-700 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <span className="truncate">{file.name}</span>
                <span className="text-indigo-500 ml-auto text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Generate AI Summary PDF
                </>
              )}
            </button>

            {error && (
              <div className="flex items-start gap-2 text-sm p-3 bg-red-50 text-red-700 rounded-md mt-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[800px] overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Generated Document</h2>
            {pdfUrl && (
              <a 
                href={pdfUrl} 
                download={`AI_Tender_Summary_${mode}.pdf`}
                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors rounded-full border border-indigo-200"
              >
                <Download className="h-3 w-3" />
                Download PDF
              </a>
            )}
          </div>
          
          <div className="flex-1 overflow-hidden bg-gray-100 rounded-b-xl relative">
            {pdfUrl ? (
               <iframe 
                 src={pdfUrl} 
                 className="w-full h-full border-none"
                 title="Generated PDF Document"
               />
            ) : loading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 p-4">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                <p>Reading documents and consulting Gemini AI...</p>
                <p className="text-xs text-gray-400">This can take up to 30 seconds depending on the PDF size.</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg">No document generated yet.</p>
                <p className="text-sm mt-2 max-w-sm text-center">Upload a ZIP file containing a tender PDF and click generate to see the AI summary.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
