import React from 'react';
import { X, Download, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
  const { success } = useToast();

  if (!isOpen || !document) return null;

  const handleDownload = () => {
    success(`Downloaded ${document.name} (Simulated Demo File)`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                {document.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Size: {document.size || '1.8 MB'} • Uploaded: {document.uploadDate || '2026-10-18'} • Status: {document.status || 'Verified'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Download Document"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body / Mock Preview Surface */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/80 flex items-center justify-center">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-md border border-slate-300 dark:border-slate-800 rounded-xl p-8 min-h-[420px] flex flex-col justify-between">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-25deg]">
              <span className="text-5xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                DEMO DOCUMENT PREVIEW
              </span>
            </div>

            {/* Official Header Header */}
            <div>
              <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Regulatory Compliance Document
                    </h4>
                    <p className="text-[10px] text-slate-400">Government Healthcare Registry Verification</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  SEAL VALIDATED
                </span>
              </div>

              <div className="mt-6 space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong className="text-slate-900 dark:text-white">Document Title:</strong> {document.name}
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-white">Format:</strong> {document.type || 'Adobe PDF Electronic Submission'}
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-white">Cryptographic Checksum:</strong>{' '}
                  <span className="font-mono text-[11px] text-slate-500">
                    sha256:4f8a91b...c928e10d2
                  </span>
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 mt-4">
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    This file is rendered as an interactive preview inside the Super Admin compliance verification drawer. In a production deployment with Node.js/Express, this renders via secure pre-signed AWS S3 or MinIO document endpoints.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer verification stamp */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-4 h-4" />
                Electronic Signature Verified
              </div>
              <span className="text-[11px] text-slate-400 font-mono">ID: {document.id}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Fictional demo document • Never use real patient or PHI data
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
