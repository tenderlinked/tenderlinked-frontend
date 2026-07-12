import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

export const handleTenderDownload = async (tender: { id: string, title: string, noticePdfUrl?: string | null, tenderPdfUrl?: string | null, sourceUrl?: string | null }, event?: React.MouseEvent, token?: string) => {
  const targetElement = event?.currentTarget as HTMLElement | undefined;
  
  let docs: string[] = [];
  let useBackendDownload = false;
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiUrl}/api/tenders/${tender.id}/documents`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        useBackendDownload = true;
      }
    }
  } catch (err) {
    console.error('Failed to fetch tender documents from API:', err);
  }

  if (useBackendDownload) {
    // Top-level navigation to trigger download without blob restrictions
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    window.location.href = `${apiUrl}/api/tenders/${tender.id}/download-all${tokenQuery}`;
    return;
  }

  // Fallback to parsed URLs if backend doesn't have downloaded files
  const isSessionDependent = (url: string) => url.includes('nicgep/app') || url.includes('session=');

  if (tender.noticePdfUrl && tender.noticePdfUrl !== '__CREDIT_LOCKED__' && !isSessionDependent(tender.noticePdfUrl)) {
    docs.push(tender.noticePdfUrl);
  }
  
  if (tender.tenderPdfUrl && tender.tenderPdfUrl !== '__CREDIT_LOCKED__' && !isSessionDependent(tender.tenderPdfUrl)) {
    docs.push(tender.tenderPdfUrl);
  }

  if (docs.length === 0) {
    if (targetElement) {
      const element = targetElement;
      const rect = element.getBoundingClientRect();
      const tooltip = document.createElement('div');
      tooltip.textContent = 'No documents available';
      tooltip.style.position = 'absolute';
      tooltip.style.top = `${rect.top + window.scrollY - 40}px`;
      tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.backgroundColor = '#ef4444';
      tooltip.style.color = 'white';
      tooltip.style.padding = '6px 12px';
      tooltip.style.borderRadius = '6px';
      tooltip.style.fontSize = '12px';
      tooltip.style.fontWeight = '500';
      tooltip.style.zIndex = '9999';
      tooltip.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.opacity = '0';
      tooltip.style.transition = 'opacity 0.2s, top 0.2s';
      
      const arrow = document.createElement('div');
      arrow.style.position = 'absolute';
      arrow.style.bottom = '-4px';
      arrow.style.left = '50%';
      arrow.style.transform = 'translateX(-50%) rotate(45deg)';
      arrow.style.width = '8px';
      arrow.style.height = '8px';
      arrow.style.backgroundColor = '#ef4444';
      arrow.style.zIndex = '-1';
      tooltip.appendChild(arrow);
    
      document.body.appendChild(tooltip);
    
      requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
        tooltip.style.top = `${rect.top + window.scrollY - 45}px`;
      });
    
      setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.top = `${rect.top + window.scrollY - 50}px`;
        setTimeout(() => tooltip.remove(), 200);
      }, 2500);
    } else {
      toast.error('No documents available to download.');
    }
    return;
  }

  if (docs.length === 1) {
    const url = docs[0];
    if (url.includes('.')) {
      window.open(url, '_blank');
      return;
    }

    const toastId = toast.loading('Downloading document...');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      const blob = await response.blob();
      
      let filename = url.split('/').pop() || 'document';
      if (filename.includes('?')) filename = filename.split('?')[0];
      filename = decodeURIComponent(filename);

      const buffer = await blob.slice(0, 4).arrayBuffer();
      const view = new Uint8Array(buffer);
      
      if (view.length >= 4 && view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04) {
        filename += '.zip';
      } else if (view.length >= 4 && view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46) {
        filename += '.pdf';
      } else {
        filename += '.pdf';
      }
      
      saveAs(blob, filename);
      toast.success('Download complete', { id: toastId });
    } catch (err) {
      console.error('Failed to download single file:', err);
      toast.error('Opening document directly...', { id: toastId });
      window.open(url, '_blank');
    }
    return;
  }

  const toastId = toast.loading('Preparing zip file...');
  try {
    const zip = new JSZip();
    let fetchedCount = 0;
    
    const fetchPromises = docs.map(async (url, index) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await response.blob();
        
        let filename = url.split('/').pop() || `document_${index + 1}`;
        if (filename.includes('?')) filename = filename.split('?')[0];
        filename = decodeURIComponent(filename);

        // Check magic bytes to determine extension if not present
        if (!filename.includes('.')) {
          const buffer = await blob.slice(0, 4).arrayBuffer();
          const view = new Uint8Array(buffer);
          
          if (view.length >= 4 && view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04) {
            filename += '.zip';
          } else if (view.length >= 4 && view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46) {
            filename += '.pdf';
          } else {
            // fallback based on name
            if (url.toLowerCase().includes('notice')) filename += '.pdf';
            else filename += '.pdf'; // default fallback
          }
        }
        
        zip.file(filename, blob);
        fetchedCount++;
      } catch (err) {
        console.error('Error fetching document for zip:', err);
      }
    });

    await Promise.allSettled(fetchPromises);

    if (fetchedCount === 0) {
        toast.error('Failed to download documents. Opening them instead.', { id: toastId });
        docs.forEach(doc => window.open(doc, '_blank'));
        return;
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const safeTitle = tender.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'tender';
    saveAs(zipBlob, `Tender_${safeTitle}.zip`);
    toast.success('Download complete', { id: toastId });
  } catch (error) {
    console.error('Zip generation failed', error);
    toast.error('Failed to create zip file.', { id: toastId });
    docs.forEach(doc => window.open(doc, '_blank'));
  }
};
