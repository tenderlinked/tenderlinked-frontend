"use client";

import { useState } from "react";
import { Upload, FileType, CheckCircle, AlertCircle, Table } from "lucide-react";

export default function TestBoqPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const response = await fetch(`${API_URL}/api/queue/test-boq`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload and process file");
      }

      setResult(data);
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
          <Table className="h-8 w-8 text-blue-600" />
          BOQ Extraction Tester
        </h1>
        <p className="text-gray-500">
          Upload a <code>.zip</code> file containing an Excel BOQ macro to test the extraction logic immediately.
        </p>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Upload Section */}
        <div className="w-full max-w-xl mx-auto bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Upload ZIP</h2>
          
          <div className="flex flex-col gap-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
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
              <div className="flex items-center gap-2 text-sm p-3 bg-blue-50 text-blue-700 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <span className="truncate">{file.name}</span>
                <span className="text-blue-500 ml-auto text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Extracting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Extract
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
        <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[700px] overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Extraction Result</h2>
            {result?.count !== undefined && (
              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                {result.count} rows found
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-auto bg-white rounded-b-xl">
            {result && result.data && result.data.length > 0 ? (
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 shadow-sm z-10">
                  <tr>
                    {Object.keys(result.data[0]).map((header, idx) => (
                      <th key={idx} className="px-4 py-3 whitespace-nowrap font-semibold border-b border-gray-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.data.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className="hover:bg-blue-50 transition-colors">
                      {Object.keys(result.data[0]).map((header, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 max-w-[300px] truncate" title={String(row[header] || '')}>
                          {row[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : loading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 p-4">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                <p>Analyzing ZIP File & Extracting Excel...</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 bg-gray-50">
                <Table className="h-12 w-12 text-gray-300 mb-4" />
                <p>Upload a ZIP file to see the extracted BOQ data presented in a table.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
