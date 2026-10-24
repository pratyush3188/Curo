import { useState, useRef } from 'react';
import { 
  FileText, Activity, AlertTriangle, Upload, CheckCircle2, 
  ShieldCheck, Sparkles, X, FileCheck, ArrowRight, Printer, RotateCcw, ExternalLink
} from 'lucide-react';
import api from '../../api/client';

// eslint-disable-next-line no-unused-vars
export function AnalyzerView({ user, initialReport, onReportSaved }) {
  const [reportType, setReportType] = useState('Blood Test');
  const [language, setLanguage] = useState('English');
  const [symptoms, setSymptoms] = useState('');
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(
    initialReport ? {
      markdown: initialReport.simplifiedMarkdown || initialReport.laymanExplanation,
      data: {
        health_score: initialReport.healthScore,
        critical_alert: initialReport.criticalAlert,
        disease_prediction: initialReport.diseasePrediction || initialReport.executiveSummary,
        lab_values: initialReport.labValues || initialReport.biomarkers,
        class_distribution: initialReport.classDistribution,
        doctor_name: initialReport.doctorName,
        hospital_name: initialReport.hospitalName,
      }
    } : null
  );

  const presets = [
    {
      title: 'Metabolic & Lipid Panel (Elevated Sugar & Cholesterol)',
      type: 'Lipid Profile',
      text: `Comprehensive Metabolic & Lipid Diagnostic Panel:
Fasting Blood Sugar: 145 mg/dL (Reference Range: 70 - 99 mg/dL) [HIGH]
HbA1c: 6.8% (Reference Range: < 5.7%) [HIGH]
Total Cholesterol: 242 mg/dL (Reference Range: < 200 mg/dL) [HIGH]
LDL Cholesterol: 156 mg/dL (Reference Range: < 100 mg/dL) [HIGH]
HDL Cholesterol: 42 mg/dL (Reference Range: > 40 mg/dL) [NORMAL]
Triglycerides: 210 mg/dL (Reference Range: < 150 mg/dL) [HIGH]
Serum Creatinine: 0.95 mg/dL (Reference Range: 0.7 - 1.3 mg/dL) [NORMAL]
eGFR: 92 mL/min/1.73m2 (Reference Range: > 90) [NORMAL]`
    },
    {
      title: 'Complete Blood Count (CBC) with Anemia',
      type: 'Blood Test',
      text: `Complete Blood Count (CBC) Laboratory Report:
Hemoglobin: 9.8 g/dL (Reference Range: 13.0 - 17.0 g/dL) [LOW]
RBC Count: 3.4 million/uL (Reference Range: 4.5 - 5.9) [LOW]
MCV: 72 fL (Reference Range: 80 - 100 fL) [LOW - Microcytic]
MCH: 23 pg (Reference Range: 27 - 33 pg) [LOW - Hypochromic]
WBC Count: 6,800 /uL (Reference Range: 4,000 - 11,000) [NORMAL]
Platelet Count: 245,000 /uL (Reference Range: 150,000 - 450,000) [NORMAL]`
    },
    {
      title: 'Thyroid Function Panel (Elevated TSH)',
      type: 'Thyroid Profile',
      text: `Thyroid Diagnostic Function Profile:
TSH (Thyroid Stimulating Hormone): 8.4 uIU/mL (Reference Range: 0.4 - 4.2 uIU/mL) [ELEVATED]
Free T4 (Thyroxine): 0.82 ng/dL (Reference Range: 0.8 - 1.8 ng/dL) [BORDERLINE LOW]
Free T3 (Triiodothyronine): 2.4 pg/mL (Reference Range: 2.0 - 4.4 pg/mL) [NORMAL]`
    }
  ];

  const handleFileChange = (file) => {
    if (!file) return;
    setUploadedFile(file);
    setFileName(file.name);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handlePresetSelect = (preset) => {
    setRawText(preset.text);
    setReportType(preset.type);
    setFileName(preset.title.slice(0, 25).replace(/\s+/g, '_') + '.pdf');
    setUploadedFile(null);
  };

  const handleAnalyzeSubmit = async (e) => {
    e.preventDefault();

    if (!uploadedFile && !rawText.trim()) {
      alert('Please upload a medical report file (PDF/Image) or enter diagnostic text.');
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }
      formData.append('text', rawText);
      formData.append('fileName', fileName || uploadedFile?.name || 'Diagnostic_Report.pdf');
      formData.append('reportType', reportType);
      formData.append('language', language);
      formData.append('symptoms', symptoms);
      formData.append('saveRecord', 'true');

      const res = await api.post('/reports/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data) {
        const payloadData = res.data.data || res.data;
        const payloadMarkdown = res.data.markdown || res.data.simplifiedMarkdown || payloadData.simplified_markdown || '';
        setAnalysisResult({
          data: payloadData,
          markdown: payloadMarkdown,
        });
        if (onReportSaved) onReportSaved();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error executing AI report analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOpenDedicatedWindow = () => {
    if (!analysisResult) return;
    const w = window.open('', '_blank', 'width=920,height=850,scrollbars=yes,resizable=yes');
    if (!w) {
      alert('Pop-up blocked. Please allow pop-ups for this site to view the simplified window.');
      return;
    }
    const safeTitle = fileName || 'Diagnostic_Analysis';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CURO AI Diagnostic Summary - ${safeTitle}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap">
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 28px; line-height: 1.6; }
          .container { max-width: 840px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 40px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.06); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 28px; }
          .logo { font-weight: 900; font-size: 26px; color: #0284c7; letter-spacing: -0.5px; }
          .badge { background: #e0f2fe; color: #0369a1; padding: 5px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .score-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 20px; padding: 24px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; }
          .score { font-size: 44px; font-weight: 900; color: #15803d; }
          .table-wrap { overflow-x: auto; margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
          th { background: #f8fafc; padding: 14px 18px; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
          td { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; }
          .normal { color: #166534; font-weight: 700; background: #dcfce7; padding: 3px 10px; border-radius: 8px; font-size: 11px; }
          .attention { color: #9a3412; font-weight: 700; background: #ffedd5; padding: 3px 10px; border-radius: 8px; font-size: 11px; }
          .critical { color: #991b1b; font-weight: 700; background: #fee2e2; padding: 3px 10px; border-radius: 8px; font-size: 11px; }
          .markdown-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; white-space: pre-wrap; font-size: 14px; color: #1e293b; line-height: 1.8; }
          .btn-print { background: #0284c7; color: white; border: none; padding: 10px 22px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 13px; box-shadow: 0 4px 12px rgba(2,132,199,0.25); }
          .btn-print:hover { background: #0369a1; }
          @media print { body { padding: 0; background: white; } .container { box-shadow: none; border: none; padding: 0; } .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="logo">CURO VEDA AI</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Simplified Clinical Interpretation &bull; Selected Language: <strong>${language}</strong></div>
            </div>
            <div style="text-align: right;">
              <span class="badge">CURO AI Engine</span>
              <div style="margin-top: 10px;"><button class="btn-print" onclick="window.print()">🖨️ Print / Save PDF</button></div>
            </div>
          </div>
          <div class="score-card">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Overall Health Score</div>
              <div style="font-size: 15px; font-weight: 700; color: #334155; margin-top: 4px;">${analysisResult.data?.disease_prediction || 'Evaluation Complete'}</div>
            </div>
            <div class="score">${analysisResult.data?.health_score || 85}<span style="font-size: 20px; color: #94a3b8; font-weight: 700;">/100</span></div>
          </div>
          ${analysisResult.data?.lab_values?.length > 0 ? `
          <h3 style="font-size: 16px; font-weight: 800; margin: 24px 0 12px; color: #0f172a;">Laboratory Biomarkers Breakdown</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Biomarker</th>
                  <th>Measured Value</th>
                  <th>Standard Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${analysisResult.data.lab_values.map(v => `
                  <tr>
                    <td><strong>${v.name}</strong></td>
                    <td style="color: #0284c7; font-weight: 700;">${v.value} ${v.unit || ''}</td>
                    <td style="font-family: monospace; color: #64748b;">${v.range}</td>
                    <td><span class="${v.severity === 'Normal' ? 'normal' : v.severity === 'Critical' ? 'critical' : 'attention'}">${v.severity}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          <h3 style="font-size: 16px; font-weight: 800; margin: 28px 0 12px; color: #0f172a;">Simplified Clinical Insights (${language})</h3>
          <div class="markdown-box">${analysisResult.markdown}</div>
          <div style="margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            Generated via CURO AI Diagnostic Engine &bull; This is an AI-simplified clinical summary. Always consult your attending doctor for medical decisions.
          </div>
        </div>
      </body>
      </html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black tracking-widest text-sky-600 uppercase">
            Curo Veda AI &bull; Clinical Diagnostic Engine
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            AI Diagnostic Active
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-2">
          Medical Diagnostic Report Analyzer
        </h1>
        <p className="text-slate-500 max-w-2xl text-sm leading-relaxed">
          Upload your blood test, lipid panel, or scan in PDF/Image format. Advanced AI translates complex laboratory ranges, biomarker measurements, and medical jargon into clear, actionable health insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: File Upload + Parameters */}
        <div className="lg:col-span-5 bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="h-10 w-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Upload Diagnostic Report</h3>
              <p className="text-xs text-slate-400">PDF, PNG, JPG, or Scanned Lab Report</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ⚡ Or Select A Quick Lab Test Preset
            </label>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-xs font-semibold text-slate-700 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-2">{preset.title}</span>
                  <span className="text-[10px] text-sky-600 opacity-0 group-hover:opacity-100 font-bold shrink-0">Load</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAnalyzeSubmit} className="space-y-4">
            {/* Real File Upload Drag & Drop Zone */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Upload Report File (PDF / Image OCR)
              </label>

              {!uploadedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-sky-500 bg-sky-50/80 scale-[1.01]'
                      : 'border-slate-300 hover:border-sky-400 hover:bg-sky-50/40 bg-slate-50/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,.txt"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="h-12 w-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 mb-0.5">
                    Click to browse or drag & drop report
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PDF, JPG, PNG or Scanned photo (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <FileCheck className="h-5 w-5 text-sky-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{uploadedFile.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {(uploadedFile.size / 1024).toFixed(1)} KB &bull; Ready for AI parsing
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      setFileName('');
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category
                </label>
                <select 
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                >
                  <option value="Blood Test">Blood Test (CBC)</option>
                  <option value="Lipid Profile">Lipid Profile</option>
                  <option value="Thyroid Profile">Thyroid Profile</option>
                  <option value="Urine Analysis">Urine Analysis</option>
                  <option value="Metabolic Panel">Metabolic Panel</option>
                  <option value="X-Ray">X-Ray (Imaging)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Language Output
                </label>
                <select 
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Hinglish">Hinglish (Hindi-English)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Associated Symptoms (Optional)
              </label>
              <input 
                type="text"
                placeholder="e.g. Dizziness, fatigue, elevated thirst, chest tightness"
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-sky-500"
              />
            </div>

            {/* Diagnostic Text input (or preview of report text) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Report Text / Notes {uploadedFile ? '(Optional extra notes)' : '(Or paste text here)'}
              </label>
              <textarea 
                rows={5}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste lab results or diagnostic parameters (e.g. Glucose: 140 mg/dL, Total Cholesterol: 230 mg/dL)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-sky-500 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md shadow-sky-600/20 text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  <span>AI is analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Analyze Report with AI</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 space-y-6">
          {analysisResult ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Score header card */}
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-6">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Clinical Vitality Score
                      </span>
                       <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                         AI Verified Analysis
                       </span>
                    </div>
                    <h2 className="text-4xl font-black text-sky-600">
                      {analysisResult.data?.health_score || 85}<span className="text-xl text-slate-300 font-bold">/100</span>
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 font-semibold">
                      {analysisResult.data?.disease_prediction || 'Clinical diagnostic evaluation complete.'}
                    </p>
                 </div>

                 <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                         {analysisResult.data?.class_distribution?.Normal || 0} Normal
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                         {analysisResult.data?.class_distribution?.['Attention Required'] || 0} Review Needed
                      </span>
                      {analysisResult.data?.critical_alert && (
                        <span className="px-3 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 text-xs font-bold animate-pulse">
                          Critical Alert
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleOpenDedicatedWindow}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Open full simplified summary in a separate distraction-free window"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open in Dedicated Window
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print
                    </button>
                 </div>
              </div>

              {/* Lab Values Table */}
              {analysisResult.data?.lab_values?.length > 0 && (
                <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="text-base font-bold text-slate-900">Extracted Biomarker Ranges & Values</h3>
                     <span className="text-xs text-slate-400 font-semibold">{analysisResult.data.lab_values.length} Biomarkers</span>
                   </div>
                   <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left text-xs">
                         <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                               <th className="p-3.5">Biomarker</th>
                               <th className="p-3.5">Measured Value</th>
                               <th className="p-3.5">Standard Range</th>
                               <th className="p-3.5">Clinical Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 font-medium">
                            {analysisResult.data.lab_values.map((val, idx) => (
                               <tr key={idx} className="hover:bg-slate-50/60">
                                  <td className="p-3.5 font-bold text-slate-900">{val.name}</td>
                                  <td className="p-3.5 font-bold text-sky-600">{val.value} {val.unit}</td>
                                  <td className="p-3.5 text-slate-500 font-mono">{val.range}</td>
                                  <td className="p-3.5">
                                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        val.severity === 'Normal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        val.severity === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        'bg-amber-50 text-amber-700 border border-amber-200'
                                     }`}>
                                        {val.severity}
                                     </span>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {/* Simplified Markdown Analysis */}
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                 <div className="flex items-center gap-2">
                   <Sparkles className="h-4 w-4 text-sky-600" />
                   <h3 className="text-base font-bold text-slate-900">Patient-Friendly Clinical Interpretation</h3>
                 </div>
                 <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans">
                    {analysisResult.markdown}
                 </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-14 border border-slate-200 shadow-sm text-center space-y-4">
               <div className="h-16 w-16 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center mx-auto border border-sky-100">
                  <Activity className="h-8 w-8" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Ready for AI Report Analysis</h3>
               <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Upload your medical report scan, PDF, or select one of the clinical presets on the left. The AI diagnostic engine will extract biomarkers, identify normal vs critical ranges, and explain your health markers in plain language.
               </p>
               <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-600 pt-2">
                 <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> PDF & Image OCR</span>
                 <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Multilingual Output</span>
                 <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Biomarker Parsing</span>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
