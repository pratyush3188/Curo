import { useState, useEffect, useRef } from 'react';
import { 
  FileText, AlertTriangle, ShieldCheck, Pill, CheckCircle2, 
  Upload, AlertOctagon, Info, Clock, RotateCcw, Sparkles, Building2, User,
  FileCheck, X, Printer, ExternalLink
} from 'lucide-react';
import api from '../../api/client';

// eslint-disable-next-line no-unused-vars
export function PrescriptionView({ user }) {
  const [doctorName, setDoctorName] = useState('Dr. Rajesh Sharma (Cardiology)');
  const [hospitalOrClinic, setHospitalOrClinic] = useState('Lilavati Hospital & Research Centre');
  const [language, setLanguage] = useState('English');
  const [fileName, setFileName] = useState('');
  const [prescriptionText, setPrescriptionText] = useState(`Rx:
1. Tab Aspirin 75mg - 1 tablet OD after breakfast
2. Tab Warfarin 5mg - 1 tablet OD at bedtime
3. Tab Atorvastatin 20mg - 1 tablet at night
4. Tab Pantoprazole 40mg - 1 tablet OD empty stomach before food
5. Tab Paracetamol 650mg - 1 tablet TDS if fever > 100 F`);

  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'

  const presets = [
    {
      title: 'Aspirin + Warfarin (Critical Interaction)',
      text: `Rx:
1. Tab Aspirin 75mg - OD post breakfast
2. Tab Warfarin 5mg - OD post dinner
3. Tab Pantoprazole 40mg - OD before breakfast`,
      doctor: 'Dr. R. Sharma (Lilavati Hospital)',
      hospital: 'Lilavati Hospital & Research Centre'
    },
    {
      title: 'Atorvastatin + Clarithromycin (High Risk)',
      text: `Rx:
1. Tab Atorvastatin 40mg - 1 tab bedtime
2. Tab Clarithromycin 500mg - 1 tab BID for 7 days
3. Tab Paracetamol 650mg - SOS for pain`,
      doctor: 'Dr. Ananya Roy (Apollo Clinic)',
      hospital: 'Apollo Clinic Bandra'
    },
    {
      title: 'Safe Antibiotic & Supportive Script',
      text: `Rx:
1. Tab Amoxicillin + Clavulanic Acid (Augmentin 625mg) - 1 tab BID with food
2. Tab Pantoprazole 40mg - 1 tab OD empty stomach
3. Tab Paracetamol 650mg - 1 tab TDS post meals`,
      doctor: 'Dr. Siddharth Sen (Kokilaben Hospital)',
      hospital: 'Kokilaben Dhirubhai Ambani Hospital'
    },
    {
      title: 'Dosage Error: Paracetamol 5000mg/day',
      text: `Rx:
1. Tab Paracetamol 1000mg - 1 tab every 4 hours (Total 5000mg - 6000mg daily)
2. Tab Metformin 500mg - 1 tab BID post meal`,
      doctor: 'Dr. Meera Nambiar (Sunrise Clinic)',
      hospital: 'Sunrise Family Healthcare'
    }
  ];

  const fetchHistory = async () => {
    try {
      const res = await api.get('/prescriptions/my');
      if (res.data?.prescriptions) {
        setHistory(res.data.prescriptions);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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
    setPrescriptionText(preset.text);
    setDoctorName(preset.doctor);
    setHospitalOrClinic(preset.hospital);
    setFileName(`${preset.title.slice(0, 15).replace(/\s+/g, '_')}_Rx.pdf`);
    setUploadedFile(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!uploadedFile && !prescriptionText.trim()) {
      alert('Please upload a prescription scan or enter the medication script.');
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }
      formData.append('fileName', fileName || uploadedFile?.name || 'Prescription.pdf');
      formData.append('prescriptionText', prescriptionText);
      formData.append('doctorName', doctorName);
      formData.append('hospitalOrClinic', hospitalOrClinic);
      formData.append('language', language);

      const res = await api.post('/prescriptions/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.data) {
        setAnalysisResult(res.data.data);
        fetchHistory();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error evaluating prescription safety.');
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
    const safeTitle = doctorName || 'Prescription_Safety_Report';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CURO Prescription Safety - ${safeTitle}</title>
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
          .score-card { background: ${analysisResult.safetyScore >= 80 ? '#f0fdf4' : analysisResult.safetyScore >= 60 ? '#fffbeb' : '#fef2f2'}; border: 1px solid ${analysisResult.safetyScore >= 80 ? '#bbf7d0' : analysisResult.safetyScore >= 60 ? '#fde68a' : '#fecaca'}; border-radius: 20px; padding: 24px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; }
          .score { font-size: 44px; font-weight: 900; color: ${analysisResult.safetyScore >= 80 ? '#15803d' : analysisResult.safetyScore >= 60 ? '#b45309' : '#b91c1c'}; }
          .card-alert { background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 18px; margin-bottom: 14px; color: #991b1b; }
          .card-warn { background: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 18px; margin-bottom: 14px; color: #92400e; }
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
              <div class="logo">CURO PHARMACOTHERAPY AI</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Prescription Safety & Interaction Audit &bull; Language: <strong>${language}</strong></div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Prescribed By: <strong>${doctorName}</strong> (${hospitalOrClinic})</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">Engine: ${analysisResult.modelUsed || 'Groq Neural Model'}</span>
              <div style="margin-top: 10px;"><button class="btn-print" onclick="window.print()">🖨️ Print / Save PDF</button></div>
            </div>
          </div>
          <div class="score-card">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Prescription Safety Index</div>
              <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px;">
                ${analysisResult.safetyScore >= 80 ? 'Prescription Verified Safe' : analysisResult.safetyScore >= 60 ? 'Caution Advised - Interactions Found' : 'Critical Interaction Warning!'}
              </div>
            </div>
            <div class="score">${analysisResult.safetyScore}<span style="font-size: 20px; color: #94a3b8; font-weight: 700;">/100</span></div>
          </div>
          ${analysisResult.contraindications?.length > 0 ? `
          <h3 style="font-size: 16px; font-weight: 800; margin: 24px 0 12px; color: #dc2626;">Drug-Drug Interactions</h3>
          ${analysisResult.contraindications.map(c => `
            <div class="card-alert">
              <div style="font-weight: 800; font-size: 14px;">⚠️ ${c.drugPair} (${c.severity} Severity)</div>
              <p style="margin: 6px 0; font-size: 13px;">${c.description}</p>
              <div style="font-size: 12px; font-weight: 700; margin-top: 8px;">Action: ${c.recommendation}</div>
            </div>
          `).join('')}
          ` : ''}
          ${analysisResult.dosageWarnings?.length > 0 ? `
          <h3 style="font-size: 16px; font-weight: 800; margin: 24px 0 12px; color: #d97706;">Dosage & Schedule Alerts</h3>
          ${analysisResult.dosageWarnings.map(d => `
            <div class="card-warn">
              <div style="font-weight: 800; font-size: 14px;">⏱️ ${d.medication}</div>
              <p style="margin: 6px 0; font-size: 13px;">${d.warning}</p>
              <div style="font-size: 12px; font-weight: 700; margin-top: 8px;">Guidance: ${d.correction}</div>
            </div>
          `).join('')}
          ` : ''}
          <h3 style="font-size: 16px; font-weight: 800; margin: 28px 0 12px; color: #0f172a;">Simplified Patient Explanation (${language})</h3>
          <div class="markdown-box">${analysisResult.simplifiedSummary || 'All medications evaluated cleanly.'}</div>
          <div style="margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            Generated via CURO Groq AI Pharmacotherapy Engine &bull; Verify all medications with your licensed physician or pharmacist.
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
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-widest text-sky-600 uppercase">
              Clinical Pharmacotherapy &bull; Groq Neural AI
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-100 text-sky-700">
              Active: openai/gpt-oss-120b
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">
            Prescription Error & Safety Checker
          </h1>
          <p className="text-slate-500 max-w-2xl text-sm">
            Detect hazardous drug-drug contraindications, accidental over-dosages, schedule conflicts, and verify safe therapeutic dosing with Groq AI.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl shrink-0 self-start">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'new'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            New Analysis
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            History ({history.length})
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* History View */
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Analyzed Prescriptions Log</h2>
              <p className="text-xs text-slate-500">All past prescription checks stored in your medical profile</p>
            </div>
            <button
              onClick={() => setActiveTab('new')}
              className="px-4 py-2 bg-sky-50 text-sky-600 rounded-xl font-bold text-xs hover:bg-sky-100 cursor-pointer"
            >
              + Check Another Prescription
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-16">
              <Pill className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-bold text-sm">No prescriptions analyzed yet</p>
              <p className="text-slate-400 text-xs">Run your first prescription check using the new analysis tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div key={item._id} className="p-5 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all bg-slate-50/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.doctorName || 'Prescribing Physician'}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-sky-500" />
                        {item.hospitalOrClinic || 'Healthcare Facility'}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      item.safetyScore >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      item.safetyScore >= 60 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      Score: {item.safetyScore}/100
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 line-clamp-3 bg-white p-3 rounded-xl border border-slate-100 mb-3 font-mono">
                    {item.rawPrescriptionText}
                  </div>

                  {item.contraindicationsFound?.length > 0 && (
                    <div className="p-2.5 bg-red-50/80 rounded-xl border border-red-200 text-[11px] text-red-700 font-semibold mb-3 flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{item.contraindicationsFound.length} Contraindication(s) detected</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <button
                      onClick={() => {
                        setPrescriptionText(item.rawPrescriptionText);
                        setDoctorName(item.doctorName);
                        setHospitalOrClinic(item.hospitalOrClinic);
                        setActiveTab('new');
                        setAnalysisResult({
                          safetyScore: item.safetyScore,
                          contraindications: item.contraindicationsFound,
                          dosageWarnings: item.dosageWarnings,
                          medications: item.medications,
                          simplifiedSummary: item.simplifiedSummary,
                        });
                      }}
                      className="text-sky-600 hover:text-sky-700 font-bold cursor-pointer"
                    >
                      View Full Analysis &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* New Analysis Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form */}
          <div className="lg:col-span-5 bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Prescription Details</h3>
                  <p className="text-xs text-slate-400">Upload prescription photo/PDF or enter text</p>
                </div>
              </div>
            </div>

            {/* Quick Test Presets */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ⚡ Quick Clinical Test Presets
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

            <form onSubmit={handleAnalyze} className="space-y-4">
              {/* Drag & Drop File Upload */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Upload Rx Image / PDF Scan (OCR)
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
                    <div className="h-10 w-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 mb-0.5">
                      Click to upload prescription photo or PDF
                    </p>
                    <p className="text-[11px] text-slate-400">
                      OCR extracts medicines automatically
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      <FileCheck className="h-5 w-5 text-sky-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{uploadedFile.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {(uploadedFile.size / 1024).toFixed(1)} KB &bull; Uploaded for Groq AI verification
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

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Prescribing Doctor
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Hospital or Clinic Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={hospitalOrClinic}
                    onChange={(e) => setHospitalOrClinic(e.target.value)}
                    required
                    placeholder="e.g. Lilavati Hospital or Apollo Clinic"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Language Output
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
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

              {/* Raw prescription text */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Prescription Script {uploadedFile ? '(Optional extra details)' : '(Or enter medicines text)'}
                </label>
                <textarea
                  rows={5}
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  placeholder="Enter medication names, dosage (e.g. 500mg), frequency and instructions..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-sky-500 resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-sky-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    <span>Verifying with Groq AI (openai/gpt-oss-120b)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze Prescription Safety with Groq AI</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Results Section */}
          <div className="lg:col-span-7 space-y-6">
            {!analysisResult ? (
              <div className="bg-white rounded-[2rem] p-12 border border-slate-200 text-center shadow-sm">
                <div className="h-16 w-16 bg-sky-50 rounded-3xl flex items-center justify-center text-sky-600 mx-auto mb-4 border border-sky-100">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Groq Pharmacotherapy Engine Active</h3>
                <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed mb-6">
                  Select a clinical test preset on the left or upload a doctor prescription to analyze drug-drug contraindications, liver/kidney cautions, and verified dosing schedules.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mb-1" />
                    <div className="font-bold text-[11px] text-slate-800">Drug Interactions</div>
                    <div className="text-[10px] text-slate-400">Warfarin, Statins, NSAIDs</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Clock className="h-4 w-4 text-sky-500 mb-1" />
                    <div className="font-bold text-[11px] text-slate-800">Dosage Over-limit</div>
                    <div className="text-[10px] text-slate-400">Daily ceiling alerts</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-1" />
                    <div className="font-bold text-[11px] text-slate-800">Schedule Helper</div>
                    <div className="text-[10px] text-slate-400">Pre/post meal timings</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Score & Alert Banner */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-20 w-20 rounded-3xl flex flex-col items-center justify-center font-black border ${
                      analysisResult.safetyScore >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      analysisResult.safetyScore >= 60 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      <span className="text-2xl leading-none">{analysisResult.safetyScore}</span>
                      <span className="text-[9px] uppercase tracking-wider font-bold">/ 100</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Prescription Safety Index</span>
                        {analysisResult.modelUsed && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            AI: {analysisResult.modelUsed}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {analysisResult.safetyScore >= 80 ? 'Prescription Verified Safe' :
                         analysisResult.safetyScore >= 60 ? 'Caution Advised - Interactions Found' :
                         'Critical Adverse Interaction Flagged!'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {analysisResult.contraindications?.length || 0} contraindication(s), {analysisResult.dosageWarnings?.length || 0} dosage alert(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAnalysisResult(null)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleOpenDedicatedWindow}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      title="Open full simplified summary in a separate distraction-free window"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open in Dedicated Window
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print Summary
                    </button>
                  </div>
                </div>

                {/* Contraindications Warning Cards */}
                {analysisResult.contraindications?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4" />
                      Critical Drug-Drug Interactions Detected
                    </h4>
                    {analysisResult.contraindications.map((contra, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-red-50/70 border border-red-200 text-red-950 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-red-900">{contra.drugPair}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-200 text-red-800">
                            {contra.severity} Severity
                          </span>
                        </div>
                        <p className="text-xs text-red-800 leading-relaxed">{contra.description}</p>
                        <div className="pt-2 border-t border-red-200/60 text-xs font-bold text-red-900 flex items-start gap-1.5">
                          <Info className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                          <span>Action: {contra.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dosage Warnings */}
                {analysisResult.dosageWarnings?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Dosage Over-limit Warnings
                    </h4>
                    {analysisResult.dosageWarnings.map((warn, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1 text-xs">
                        <div className="font-bold text-amber-900">{warn.medication} ({warn.dosageObserved})</div>
                        <p>{warn.warning} Standard allowable clinical range: <span className="font-mono font-bold">{warn.standardRange}</span></p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Verified Medication Schedule Table */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Structured Medication Regimen & Timing
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                          <th className="pb-3">Medicine</th>
                          <th className="pb-3">Dosage</th>
                          <th className="pb-3">Frequency</th>
                          <th className="pb-3">Instructions</th>
                          <th className="pb-3">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analysisResult.medications?.map((med, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-3 font-bold text-slate-900">{med.name}</td>
                            <td className="py-3 font-mono text-slate-600">{med.dosage}</td>
                            <td className="py-3 text-slate-700 font-semibold">{med.frequency}</td>
                            <td className="py-3 text-sky-700 font-semibold">{med.instructions}</td>
                            <td className="py-3 text-slate-500">{med.purpose}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Simplified Summary Markdown */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-600" />
                    Comprehensive Clinical Audit Report
                  </h4>
                  <pre className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl whitespace-pre-wrap font-sans leading-relaxed border border-slate-100">
                    {analysisResult.simplifiedSummary}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
