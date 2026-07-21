"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import { FileText, MapPin, DollarSign, Calendar, Edit3, Save, X } from "lucide-react";
import indiaStatesDistricts from "@/lib/india-states.json";

interface EditTenderModalProps {
  tender: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTenderModal({ tender, isOpen, onClose }: EditTenderModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [metadataOptions, setMetadataOptions] = useState<any>({
    tenderCategories: [],
    tenderTypes: [],
    productCategories: [],
    contractTypes: [],
    formOfContracts: []
  });

  useEffect(() => {
    if (isOpen && session) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/tenders/metadata/dropdowns`, {
        headers: { "Authorization": `Bearer ${(session as any)?.accessToken}` }
      })
      .then(res => res.json())
      .then(data => setMetadataOptions(data))
      .catch(console.error);
    }
  }, [isOpen, session]);

  const [formData, setFormData] = useState({
    title: tender?.title || "",
    description: tender?.description || "",
    organisation: tender?.organisation || "",
    organisationChain: tender?.organisationChain || "",
    tenderCategory: tender?.tenderCategory || "",
    tenderType: tender?.tenderType || "",
    productCategory: tender?.productCategory || "",
    subCategory: tender?.subCategory || "",
    contractType: tender?.contractType || "",
    formOfContract: tender?.formOfContract || "",
    state: tender?.state || "",
    district: tender?.district || "",
    city: tender?.city || "",
    location: tender?.location || "",
    invitingAuthorityName: tender?.invitingAuthorityName || "",
    invitingAuthorityAddress: tender?.invitingAuthorityAddress || "",
    invitingAuthorityDesignation: tender?.invitingAuthorityDesignation || "",
    publishedDate: tender?.publishedDate ? new Date(tender.publishedDate).toISOString().slice(0, 16) : "",
    startDate: tender?.startDate ? new Date(tender.startDate).toISOString().slice(0, 16) : "",
    endDate: tender?.endDate ? new Date(tender.endDate).toISOString().slice(0, 16) : "",
    bidOpeningDate: tender?.bidOpeningDate ? new Date(tender.bidOpeningDate).toISOString().slice(0, 16) : "",
    preBidMeetingDate: tender?.preBidMeetingDate ? new Date(tender.preBidMeetingDate).toISOString().slice(0, 16) : "",
    docDownloadStartDate: tender?.docDownloadStartDate ? new Date(tender.docDownloadStartDate).toISOString().slice(0, 16) : "",
    docDownloadEndDate: tender?.docDownloadEndDate ? new Date(tender.docDownloadEndDate).toISOString().slice(0, 16) : "",
    clarificationStartDate: tender?.clarificationStartDate ? new Date(tender.clarificationStartDate).toISOString().slice(0, 16) : "",
    clarificationEndDate: tender?.clarificationEndDate ? new Date(tender.clarificationEndDate).toISOString().slice(0, 16) : "",
    bidOpeningPlace: tender?.bidOpeningPlace || "",
    preBidMeetingPlace: tender?.preBidMeetingPlace || "",
    preBidMeetingAddress: tender?.preBidMeetingAddress || "",
    bidValidityDays: tender?.bidValidityDays?.toString() || "",
    periodOfWorkDays: tender?.periodOfWorkDays?.toString() || "",
    tenderValue: tender?.tenderValue || "",
    tenderAmount: tender?.tenderAmount?.toString() || "",
    emd: tender?.emd || "",
    applicationCost: tender?.applicationCost || "",
    vatCharges: tender?.vatCharges || "",
    feePayableTo: tender?.feePayableTo || "",
    feePayableAt: tender?.feePayableAt || "",
    feeExemptionAllowed: tender?.feeExemptionAllowed || "",
    emdFeeType: tender?.emdFeeType || "",
    emdPercentage: tender?.emdPercentage || "",
    emdPayableTo: tender?.emdPayableTo || "",
    emdPayableAt: tender?.emdPayableAt || "",
    emdExemptionAllowed: tender?.emdExemptionAllowed || "",
    paymentMode: tender?.paymentMode || "",
    noOfCovers: tender?.noOfCovers || "",
    onlineBankers: tender?.onlineBankers || "",
    ndaPreQualification: tender?.ndaPreQualification || "",
    allowNdaTender: tender?.allowNdaTender !== undefined ? tender?.allowNdaTender?.toString() : "",
    allowPreferentialBidder: tender?.allowPreferentialBidder !== undefined ? tender?.allowPreferentialBidder?.toString() : "",
  });

  useEffect(() => {
    if (tender) {
      setFormData({
        title: tender.title || "",
        description: tender.description || "",
        organisation: tender.organisation || "",
        organisationChain: tender.organisationChain || "",
        tenderCategory: tender.tenderCategory || "",
        tenderType: tender.tenderType || "",
        productCategory: tender.productCategory || "",
        subCategory: tender.subCategory || "",
        contractType: tender.contractType || "",
        formOfContract: tender.formOfContract || "",
        state: tender.state || "",
        district: tender.district || "",
        city: tender.city || "",
        location: tender.location || "",
        invitingAuthorityName: tender.invitingAuthorityName || "",
        invitingAuthorityAddress: tender.invitingAuthorityAddress || "",
        invitingAuthorityDesignation: tender.invitingAuthorityDesignation || "",
        publishedDate: tender.publishedDate ? new Date(tender.publishedDate).toISOString().slice(0, 16) : "",
        startDate: tender.startDate ? new Date(tender.startDate).toISOString().slice(0, 16) : "",
        endDate: tender.endDate ? new Date(tender.endDate).toISOString().slice(0, 16) : "",
        bidOpeningDate: tender.bidOpeningDate ? new Date(tender.bidOpeningDate).toISOString().slice(0, 16) : "",
        preBidMeetingDate: tender.preBidMeetingDate ? new Date(tender.preBidMeetingDate).toISOString().slice(0, 16) : "",
        docDownloadStartDate: tender.docDownloadStartDate ? new Date(tender.docDownloadStartDate).toISOString().slice(0, 16) : "",
        docDownloadEndDate: tender.docDownloadEndDate ? new Date(tender.docDownloadEndDate).toISOString().slice(0, 16) : "",
        clarificationStartDate: tender.clarificationStartDate ? new Date(tender.clarificationStartDate).toISOString().slice(0, 16) : "",
        clarificationEndDate: tender.clarificationEndDate ? new Date(tender.clarificationEndDate).toISOString().slice(0, 16) : "",
        bidOpeningPlace: tender.bidOpeningPlace || "",
        preBidMeetingPlace: tender.preBidMeetingPlace || "",
        preBidMeetingAddress: tender.preBidMeetingAddress || "",
        bidValidityDays: tender.bidValidityDays?.toString() || "",
        periodOfWorkDays: tender.periodOfWorkDays?.toString() || "",
        tenderValue: tender.tenderValue || "",
        tenderAmount: tender.tenderAmount?.toString() || "",
        emd: tender.emd || "",
        applicationCost: tender.applicationCost || "",
        vatCharges: tender.vatCharges || "",
        feePayableTo: tender.feePayableTo || "",
        feePayableAt: tender.feePayableAt || "",
        feeExemptionAllowed: tender.feeExemptionAllowed || "",
        emdFeeType: tender.emdFeeType || "",
        emdPercentage: tender.emdPercentage || "",
        emdPayableTo: tender.emdPayableTo || "",
        emdPayableAt: tender.emdPayableAt || "",
        emdExemptionAllowed: tender.emdExemptionAllowed || "",
        paymentMode: tender.paymentMode || "",
        noOfCovers: tender.noOfCovers || "",
        onlineBankers: tender.onlineBankers || "",
        ndaPreQualification: tender.ndaPreQualification || "",
        allowNdaTender: tender.allowNdaTender !== undefined ? tender.allowNdaTender?.toString() : "",
        allowPreferentialBidder: tender.allowPreferentialBidder !== undefined ? tender.allowPreferentialBidder?.toString() : "",
      });
    }
  }, [tender]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const statesList = Object.keys(indiaStatesDistricts) || [];
  const districtsList = formData.state ? (indiaStatesDistricts as any)[formData.state] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = { ...formData };
      
      if (payload.bidValidityDays) payload.bidValidityDays = parseInt(payload.bidValidityDays, 10);
      else payload.bidValidityDays = null;

      if (payload.periodOfWorkDays) payload.periodOfWorkDays = parseInt(payload.periodOfWorkDays, 10);
      else payload.periodOfWorkDays = null;

      if (payload.tenderAmount) payload.tenderAmount = parseFloat(payload.tenderAmount);
      else payload.tenderAmount = null;

      if (payload.allowNdaTender === "true") payload.allowNdaTender = true;
      if (payload.allowNdaTender === "false") payload.allowNdaTender = false;

      if (payload.allowPreferentialBidder === "true") payload.allowPreferentialBidder = true;
      if (payload.allowPreferentialBidder === "false") payload.allowPreferentialBidder = false;

      const dateFields = [
        'publishedDate', 'startDate', 'endDate', 'bidOpeningDate', 
        'preBidMeetingDate', 'docDownloadStartDate', 'docDownloadEndDate', 
        'clarificationStartDate', 'clarificationEndDate'
      ];
      dateFields.forEach(f => {
        if (payload[f]) {
          payload[f] = new Date(payload[f]).toISOString();
        } else {
          payload[f] = null;
        }
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/tenders/${tender.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update tender");
      }

      toast.success("Tender updated successfully");
      onClose();
      router.refresh(); 
    } catch (error) {
      console.error("Error updating tender:", error);
      toast.error("Error updating tender");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable component for input grouping
  const FieldGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-sm font-bold text-slate-800 flex items-center border-b border-slate-100 pb-3 mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2 shrink-0"></span>
      {title}
    </h3>
  );

  const inputClass = "h-9 border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors text-sm rounded-md";
  const selectClass = "flex h-9 w-full rounded-md border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] lg:max-w-[1200px] w-full max-h-[92vh] h-[92vh] overflow-hidden flex flex-col p-0 bg-slate-50 rounded-xl border-slate-200 shadow-2xl">
        
        {/* Header */}
        <div className="p-5 md:px-8 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              {tender?.tenderId ? `Edit ${tender.tenderId}${tender.tenderCode ? ` (${tender.tenderCode})` : ''}` : 'Edit Tender'}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1 font-medium">Update the source values for this tender directly.</p>
          </div>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-5 md:px-8 bg-slate-50/80">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4 mb-6 h-auto p-1 bg-white border border-slate-200 rounded-lg shrink-0 shadow-sm">
              <TabsTrigger value="basic" className="py-2 text-xs md:text-sm font-semibold data-[state=active]:bg-slate-100 data-[state=active]:text-blue-700 rounded-md transition-all">
                <FileText className="w-4 h-4 mr-2 hidden md:block opacity-70" />
                Basic & Config
              </TabsTrigger>
              <TabsTrigger value="location" className="py-2 text-xs md:text-sm font-semibold data-[state=active]:bg-slate-100 data-[state=active]:text-blue-700 rounded-md transition-all">
                <MapPin className="w-4 h-4 mr-2 hidden md:block opacity-70" />
                Location
              </TabsTrigger>
              <TabsTrigger value="financial" className="py-2 text-xs md:text-sm font-semibold data-[state=active]:bg-slate-100 data-[state=active]:text-blue-700 rounded-md transition-all">
                <DollarSign className="w-4 h-4 mr-2 hidden md:block opacity-70" />
                Financials
              </TabsTrigger>
              <TabsTrigger value="dates" className="py-2 text-xs md:text-sm font-semibold data-[state=active]:bg-slate-100 data-[state=active]:text-blue-700 rounded-md transition-all">
                <Calendar className="w-4 h-4 mr-2 hidden md:block opacity-70" />
                Dates
              </TabsTrigger>
            </TabsList>
            
            <form id="edit-tender-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 pb-4 no-scrollbar">
              
              {/* TAB 1: BASIC & CONFIG */}
              <TabsContent value="basic" className="m-0 space-y-6 outline-none">
                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Core Details" />
                  <div className="space-y-5">
                    <FieldGroup label="Tender Title">
                      <Textarea name="title" value={formData.title} onChange={handleChange} rows={2} className="resize-none border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm" />
                    </FieldGroup>
                    <FieldGroup label="Description">
                      <Textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm" />
                    </FieldGroup>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Classification & Types" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="Tender Category">
                      <select name="tenderCategory" value={formData.tenderCategory} onChange={handleChange} className={selectClass}>
                        <option value="">Unspecified</option>
                        {metadataOptions?.tenderCategories?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Tender Type">
                      <select name="tenderType" value={formData.tenderType} onChange={handleChange} className={selectClass}>
                        <option value="">Unspecified</option>
                        {metadataOptions?.tenderTypes?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Product Category">
                      <select name="productCategory" value={formData.productCategory} onChange={handleChange} className={selectClass}>
                        <option value="">Unspecified</option>
                        {metadataOptions?.productCategories?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Sub Category"><Input className={inputClass} name="subCategory" value={formData.subCategory} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Contract Type">
                      <select name="contractType" value={formData.contractType} onChange={handleChange} className={selectClass}>
                        <option value="">Unspecified</option>
                        {metadataOptions?.contractTypes?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Form of Contract">
                      <select name="formOfContract" value={formData.formOfContract} onChange={handleChange} className={selectClass}>
                        <option value="">Unspecified</option>
                        {metadataOptions?.formOfContracts?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </FieldGroup>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Settings & Requirements" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="No of Covers"><Input className={inputClass} name="noOfCovers" value={formData.noOfCovers} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Online Bankers"><Input className={inputClass} name="onlineBankers" value={formData.onlineBankers} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Allow NDA Tender">
                      <select name="allowNdaTender" value={formData.allowNdaTender} onChange={handleChange} className={selectClass}>
                        <option value="">Unspecified</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Allow Preferential Bidder">
                      <select name="allowPreferentialBidder" value={formData.allowPreferentialBidder} onChange={handleChange} className={selectClass}>
                        <option value="">Unspecified</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </FieldGroup>
                    <div className="md:col-span-2">
                      <FieldGroup label="NDA Pre Qualification">
                        <Input className={inputClass} name="ndaPreQualification" value={formData.ndaPreQualification} onChange={handleChange} />
                      </FieldGroup>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: LOCATION & AUTH */}
              <TabsContent value="location" className="m-0 space-y-6 outline-none">
                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Geography" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="State">
                      <select name="state" value={formData.state} onChange={handleChange} className={selectClass}>
                        <option value="">Select State</option>
                        {statesList.map((st: string) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="District">
                      <select name="district" value={formData.district} onChange={handleChange} className={selectClass} disabled={!formData.state}>
                        <option value="">Select District</option>
                        {districtsList.map((dt: string) => (
                          <option key={dt} value={dt}>{dt}</option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="City"><Input className={inputClass} name="city" value={formData.city} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Location"><Input className={inputClass} name="location" value={formData.location} onChange={handleChange} /></FieldGroup>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Inviting Authority" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="Organisation"><Input className={inputClass} name="organisation" value={formData.organisation} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Organisation Chain"><Input className={inputClass} name="organisationChain" value={formData.organisationChain} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Authority Name"><Input className={inputClass} name="invitingAuthorityName" value={formData.invitingAuthorityName} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Authority Designation"><Input className={inputClass} name="invitingAuthorityDesignation" value={formData.invitingAuthorityDesignation} onChange={handleChange} /></FieldGroup>
                    <div className="md:col-span-2">
                      <FieldGroup label="Authority Address">
                        <Textarea name="invitingAuthorityAddress" value={formData.invitingAuthorityAddress} onChange={handleChange} rows={2} className="border-slate-200 bg-slate-50/50 text-sm" />
                      </FieldGroup>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: FINANCIALS */}
              <TabsContent value="financial" className="m-0 space-y-6 outline-none">
                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Tender Value & Costs" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="Tender Value (Display)"><Input className={inputClass} name="tenderValue" value={formData.tenderValue} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Tender Amount (Numeric)"><Input className={inputClass} type="number" step="any" name="tenderAmount" value={formData.tenderAmount} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Application Cost"><Input className={inputClass} name="applicationCost" value={formData.applicationCost} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="VAT Charges"><Input className={inputClass} name="vatCharges" value={formData.vatCharges} onChange={handleChange} /></FieldGroup>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Payment & Fees" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="Payment Mode"><Input className={inputClass} name="paymentMode" value={formData.paymentMode} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Fee Exemption Allowed"><Input className={inputClass} name="feeExemptionAllowed" value={formData.feeExemptionAllowed} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Fee Payable To"><Input className={inputClass} name="feePayableTo" value={formData.feePayableTo} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Fee Payable At"><Input className={inputClass} name="feePayableAt" value={formData.feePayableAt} onChange={handleChange} /></FieldGroup>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="EMD (Earnest Money Deposit)" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="EMD Value"><Input className={inputClass} name="emd" value={formData.emd} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="EMD Exemption Allowed"><Input className={inputClass} name="emdExemptionAllowed" value={formData.emdExemptionAllowed} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="EMD Fee Type"><Input className={inputClass} name="emdFeeType" value={formData.emdFeeType} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="EMD Percentage"><Input className={inputClass} name="emdPercentage" value={formData.emdPercentage} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="EMD Payable To"><Input className={inputClass} name="emdPayableTo" value={formData.emdPayableTo} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="EMD Payable At"><Input className={inputClass} name="emdPayableAt" value={formData.emdPayableAt} onChange={handleChange} /></FieldGroup>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: DATES */}
              <TabsContent value="dates" className="m-0 space-y-6 outline-none">
                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Core Dates" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="Published Date"><Input className={inputClass} type="datetime-local" name="publishedDate" value={formData.publishedDate} onChange={handleChange} /></FieldGroup>
                    <div className="hidden md:block"></div>
                    <FieldGroup label="Bid Submission Start"><Input className={inputClass} type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Bid Submission End"><Input className={inputClass} type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Bid Opening Date"><Input className={inputClass} type="datetime-local" name="bidOpeningDate" value={formData.bidOpeningDate} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Bid Opening Place"><Input className={inputClass} name="bidOpeningPlace" value={formData.bidOpeningPlace} onChange={handleChange} /></FieldGroup>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Documents & Clarifications" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="Doc Download Start"><Input className={inputClass} type="datetime-local" name="docDownloadStartDate" value={formData.docDownloadStartDate} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Doc Download End"><Input className={inputClass} type="datetime-local" name="docDownloadEndDate" value={formData.docDownloadEndDate} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Clarification Start"><Input className={inputClass} type="datetime-local" name="clarificationStartDate" value={formData.clarificationStartDate} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Clarification End"><Input className={inputClass} type="datetime-local" name="clarificationEndDate" value={formData.clarificationEndDate} onChange={handleChange} /></FieldGroup>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                  <SectionHeader title="Meetings & Durations" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <FieldGroup label="Pre Bid Meeting Date"><Input className={inputClass} type="datetime-local" name="preBidMeetingDate" value={formData.preBidMeetingDate} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Pre Bid Meeting Place"><Input className={inputClass} name="preBidMeetingPlace" value={formData.preBidMeetingPlace} onChange={handleChange} /></FieldGroup>
                    <div className="md:col-span-2">
                      <FieldGroup label="Pre Bid Meeting Address"><Input className={inputClass} name="preBidMeetingAddress" value={formData.preBidMeetingAddress} onChange={handleChange} /></FieldGroup>
                    </div>
                    <FieldGroup label="Bid Validity (Days)"><Input className={inputClass} type="number" name="bidValidityDays" value={formData.bidValidityDays} onChange={handleChange} /></FieldGroup>
                    <FieldGroup label="Period Of Work (Days)"><Input className={inputClass} type="number" name="periodOfWorkDays" value={formData.periodOfWorkDays} onChange={handleChange} /></FieldGroup>
                  </div>
                </div>
              </TabsContent>
            </form>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-5 md:px-8 border-t border-slate-200 flex justify-end gap-4 bg-white shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="font-semibold px-6 border-slate-300 text-slate-700 hover:bg-slate-50">
            <X className="w-4 h-4 mr-1.5 opacity-70" />
            Cancel
          </Button>
          <Button type="submit" form="edit-tender-form" disabled={isSubmitting} className="font-bold px-8 bg-blue-600 hover:bg-blue-700 shadow-sm text-white transition-all hover:shadow">
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
