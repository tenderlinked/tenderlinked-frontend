import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode') || 'vision';

  // Forward the multipart form data straight to the backend
  const formData = await req.formData();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const backendRes = await fetch(
    `${API_URL}/api/queue/generate-ai-summary?mode=${mode}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!backendRes.ok) {
    let errMsg = 'Failed to generate AI Summary';
    try {
      const errData = await backendRes.json();
      if (errData.message) errMsg = errData.message;
    } catch (_) {}
    return NextResponse.json({ message: errMsg }, { status: backendRes.status });
  }

  // Stream the PDF back to the browser with the correct headers
  const pdfBuffer = await backendRes.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="AI_Tender_Summary.pdf"',
    },
  });
}
