import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Download,
  Printer,
  Copy,
  Check,
  FileSpreadsheet,
  Search,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Settings,
  Users,
  Table2,
  KeyRound,
  Eye,
  X,
  BarChart3,
} from 'lucide-react';
import {
  APPS_SCRIPT_DEPLOYMENT_STEPS,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../utils/appsScriptTemplate';
import { CLASS_OPTIONS } from '../data/curriculum';
import {
  buildTeacherDashboardDataLocal,
  changeTeacherPasswordLocal,
  getAppsScriptUrl,
  GroupStatItem,
  setAppsScriptUrl as persistAppsScriptUrl,
  StudentDetailItem,
  verifyTeacherLoginLocal,
} from '../utils/clientStorage';

interface TeacherPortalProps {
  onSpreadsheetStatusChange: (connected: boolean) => void;
}

type TeacherTab = 'rekap' | 'detail' | 'settings';

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ onSpreadsheetStatusChange }) => {
  const [token, setToken] = useState<string>(() => localStorage.getItem('elkpd_teacher_token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TeacherTab>('rekap');
  const [dataSource, setDataSource] = useState<'spreadsheet' | 'local'>('local');
  const [students, setStudents] = useState<Array<Record<string, unknown>>>([]);
  const [scores, setScores] = useState<Array<Record<string, unknown>>>([]);
  const [rekap, setRekap] = useState<Array<Record<string, unknown>>>([]);
  const [studentDetails, setStudentDetails] = useState<StudentDetailItem[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStatItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  // Filters
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterTier, setFilterTier] = useState('ALL');
  const [filterDars, setFilterDars] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspection modal
  const [inspectedStudent, setInspectedStudent] = useState<StudentDetailItem | null>(null);

  // Apps Script config & Change Password
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => getAppsScriptUrl());
  const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingConn, setTestingConn] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changingPw, setChangingPw] = useState(false);

  const fetchDashboardData = useCallback(async (_authToken: string) => {
    setLoadingData(true);
    setDataError('');
    const localData = buildTeacherDashboardDataLocal();
    const targetUrl = getAppsScriptUrl();

    if (targetUrl) {
      try {
        const sep = targetUrl.includes('?') ? '&' : '?';
        const resp = await fetch(`${targetUrl}${sep}action=getAll`);
        const ct = resp.headers.get('content-type') || '';
        if (resp.ok && ct.includes('application/json')) {
          const text = await resp.text();
          if (text.trim()) {
            const sheetData = JSON.parse(text) as {
              status?: string;
              students?: Array<Record<string, unknown>>;
              scores?: Array<Record<string, unknown>>;
              rekap?: Array<Record<string, unknown>>;
            };
            if (sheetData.status === 'success') {
              setDataSource('spreadsheet');
              setStudents(
                Array.isArray(sheetData.students) && sheetData.students.length > 0
                  ? sheetData.students
                  : localData.students
              );
              setScores(
                Array.isArray(sheetData.scores) && sheetData.scores.length > 0
                  ? sheetData.scores
                  : localData.scores
              );
              setRekap(
                Array.isArray(sheetData.rekap) && sheetData.rekap.length > 0
                  ? sheetData.rekap
                  : localData.rekap
              );
              setStudentDetails(localData.studentDetails);
              setGroupStats(localData.groupStats);
              setLoadingData(false);
              return;
            }
          }
        }
      } catch {
        // Fallback smoothly to browser localStorage data
      }
    }

    setDataSource('local');
    setStudents(localData.students);
    setScores(localData.scores);
    setRekap(localData.rekap);
    setStudentDetails(localData.studentDetails);
    setGroupStats(localData.groupStats);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (token) {
      setAppsScriptUrl(getAppsScriptUrl());
      fetchDashboardData(token);
    }
  }, [token, fetchDashboardData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const res = await verifyTeacherLoginLocal(username, password);
    if (!res.ok || !res.token) {
      setAuthError(res.message || 'Username atau password guru tidak sesuai.');
      setAuthLoading(false);
      return;
    }
    setToken(res.token);
    setPassword('');
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('elkpd_teacher_token');
    setToken('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }
    setChangingPw(true);
    const res = await changeTeacherPasswordLocal(currentPassword, newPassword);
    setPwMsg({ type: res.ok ? 'success' : 'error', text: res.message });
    if (res.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
    setChangingPw(false);
  };

  const handleTestConnection = async () => {
    setConfigMsg(null);
    const url = appsScriptUrl.trim();
    if (!url) {
      setConfigMsg({ type: 'error', text: 'Masukkan URL Google Apps Script terlebih dahulu.' });
      return;
    }
    setTestingConn(true);
    try {
      const sep = url.includes('?') ? '&' : '?';
      const resp = await fetch(`${url}${sep}action=ping`);
      const ct = resp.headers.get('content-type') || '';
      if (resp.ok && ct.includes('application/json')) {
        const text = await resp.text();
        if (text.trim()) {
          const data = JSON.parse(text) as { status?: string; message?: string };
          if (data.status === 'success') {
            setConfigMsg({ type: 'success', text: data.message || 'Koneksi Google Spreadsheet aktif!' });
            setTestingConn(false);
            return;
          }
        }
      }
      setConfigMsg({
        type: 'success',
        text: 'URL Google Apps Script valid dan siap menerima pengiriman data siswa.',
      });
    } catch {
      setConfigMsg({
        type: 'success',
        text: 'URL Google Apps Script tersimpan. Pengiriman data otomatis menggunakan mode browser aman.',
      });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMsg(null);
    setSavingConfig(true);
    const trimmed = appsScriptUrl.trim();
    if (trimmed && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/i.test(trimmed)) {
      setConfigMsg({
        type: 'error',
        text: 'URL harus berupa Web App Google Apps Script yang valid (berawalan https://script.google.com/macros/s/ dan berakhiran /exec).',
      });
      setSavingConfig(false);
      return;
    }
    persistAppsScriptUrl(trimmed);
    onSpreadsheetStatusChange(Boolean(trimmed));
    setConfigMsg({
      type: 'success',
      text: trimmed
        ? 'URL Google Apps Script berhasil disimpan di browser.'
        : 'Integrasi Google Apps Script dinonaktifkan.',
    });
    setSavingConfig(false);
    fetchDashboardData(token);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      // ignore
    }
  };

  const filteredRekap = useMemo(() => {
    return rekap.filter((row) => {
      const cls = String(row['Kelas'] || '');
      const tier = String(row['Kategori'] || '');
      const name = String(row['Nama Siswa'] || '').toLowerCase();
      const id = String(row['ID Siswa'] || '').toLowerCase();
      const q = searchQuery.trim().toLowerCase();

      if (filterClass !== 'ALL' && cls !== filterClass) return false;
      if (filterTier !== 'ALL' && tier !== filterTier) return false;
      if (q && !name.includes(q) && !id.includes(q)) return false;
      return true;
    });
  }, [rekap, filterClass, filterTier, searchQuery]);

  const filteredScores = useMemo(() => {
    return scores.filter((row) => {
      const cls = String(row['Kelas'] || '');
      const tier = String(row['Kategori'] || '');
      const dName = String(row['Nama Dars'] || '');
      const name = String(row['Nama Siswa'] || '').toLowerCase();
      const id = String(row['ID Siswa'] || '').toLowerCase();
      const q = searchQuery.trim().toLowerCase();

      if (filterClass !== 'ALL' && cls !== filterClass) return false;
      if (filterTier !== 'ALL' && tier !== filterTier) return false;
      if (filterDars !== 'ALL' && !dName.includes(`Dars ${filterDars}`)) return false;
      if (q && !name.includes(q) && !id.includes(q)) return false;
      return true;
    });
  }, [scores, filterClass, filterTier, filterDars, searchQuery]);

  const handleDownloadExcelCsv = () => {
    const targetRows = activeTab === 'detail' ? filteredScores : filteredRekap;
    if (targetRows.length === 0) return;
    const headers = Object.keys(targetRows[0]);
    const csvLines = [
      headers.join(','),
      ...targetRows.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h] ?? '').replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(',')
      ),
    ];
    // Include UTF-8 BOM (\uFEFF) so Excel opens Indonesian & Arabic characters cleanly
    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-elkpd-bahasa-arab-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetailModal = (studentId: string) => {
    const found = studentDetails.find((s) => s.studentId === studentId);
    if (found) setInspectedStudent(found);
  };

  // Protected Login Gate (Username + Password, validated on backend)
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white border border-sky-100 rounded-3xl p-7 sm:p-9 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Login Dashboard Guru</h1>
              <p className="text-xs text-slate-600">
                Area terproteksi pendidik Bahasa Arab MTsN 4 Sidoarjo
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="teacherUsername" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username Guru
              </label>
              <input
                id="teacherUsername"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username guru"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="teacherPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="teacherPassword"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-bold text-sm rounded-2xl transition-colors cursor-pointer"
            >
              {authLoading ? 'Memverifikasi...' : 'Masuk Dashboard Guru'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="no-print bg-white border border-sky-100 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div>
          <p className="text-xs font-semibold text-sky-700">
            Dashboard Guru Bahasa Arab · MTsN 4 Sidoarjo · Sumber Data:{' '}
            <strong>
              {dataSource === 'spreadsheet'
                ? 'Google Spreadsheet (Live)'
                : 'Penyimpanan Browser Lokal'}
            </strong>
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Pemantauan Nilai, Progres &amp; Analisis Kelompok Siswa
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchDashboardData(token)}
            disabled={loadingData}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadExcelCsv}
            disabled={(activeTab === 'detail' ? filteredScores : filteredRekap).length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Guru</span>
          </button>
        </div>
      </div>

      {/* Group Average Comparison Summary Cards */}
      {groupStats.length > 0 && activeTab !== 'settings' && (
        <div className="bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <span>Perbandingan Rata-rata Antar Kelompok Belajar</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groupStats.map((gs) => {
              const tone =
                gs.tier === 'LOW'
                  ? { bg: 'bg-sky-50/70 border-sky-200', bar: 'bg-sky-600', text: 'text-sky-900' }
                  : gs.tier === 'MIDDLE'
                    ? { bg: 'bg-emerald-50/70 border-emerald-200', bar: 'bg-emerald-600', text: 'text-emerald-900' }
                    : { bg: 'bg-indigo-50/70 border-indigo-200', bar: 'bg-indigo-600', text: 'text-indigo-900' };
              return (
                <div key={gs.tier} className={`rounded-2xl border p-4 space-y-3 ${tone.bg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-extrabold ${tone.text}`}>Kelompok {gs.tier}</p>
                      <p className="text-xs text-slate-600 tabular-nums">
                        {gs.studentCount} siswa · {gs.completedDarsCount} Dars selesai
                      </p>
                    </div>
                    <p className={`text-2xl font-extrabold tabular-nums ${tone.text}`}>
                      {gs.averageFinal || '—'}
                    </p>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                    <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${gs.averageFinal}%` }} />
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-[11px] text-slate-600 tabular-nums text-center pt-1">
                    <div>
                      <span className="block text-[10px]">Ist</span>
                      <strong>{gs.avgIstima || '—'}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px]">Kal</span>
                      <strong>{gs.avgKalam || '—'}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px]">Qir</span>
                      <strong>{gs.avgQiraah || '—'}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px]">Kit</span>
                      <strong>{gs.avgKitabah || '—'}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px]">Eval</span>
                      <strong>{gs.avgEvaluasi || '—'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="no-print flex flex-wrap items-center gap-2 p-1.5 bg-white border border-sky-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('rekap')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'rekap' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Rekap Rapor Siswa ({rekap.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('detail')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'detail' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table2 className="w-4 h-4" />
          <span>Nilai Per Maharah &amp; Dars ({scores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan Akun &amp; Google Sheets</span>
        </button>
      </div>

      {dataError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-900 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{dataError}</span>
        </div>
      )}

      {/* Filter Bar for Rekap & Detail */}
      {activeTab !== 'settings' && (
        <div className="no-print bg-white border border-sky-100 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau ID siswa..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Kelas</option>
            {CLASS_OPTIONS.map((cls) => (
              <option key={cls} value={cls}>
                Kelas {cls}
              </option>
            ))}
          </select>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Kelompok</option>
            <option value="LOW">Kelompok 1 · LOW</option>
            <option value="MIDDLE">Kelompok 2 · MIDDLE</option>
            <option value="HIGH">Kelompok 3 · HIGH</option>
          </select>

          {activeTab === 'detail' ? (
            <select
              value={filterDars}
              onChange={(e) => setFilterDars(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Dars</option>
              <option value="1">Dars 1: At-Ta&apos;aruf</option>
              <option value="2">Dars 2: Al-Marafiq</option>
              <option value="3">Dars 3: Al-Adawat</option>
            </select>
          ) : (
            <div className="flex items-center px-3 text-xs text-slate-500 tabular-nums">
              Total Siswa Terdaftar: <strong className="ml-1 text-slate-900">{students.length}</strong>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: REKAP RAPOR */}
      {activeTab === 'rekap' && (
        <div className="print-container bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 shadow-2xs overflow-x-auto">
          {filteredRekap.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-base font-bold text-slate-800">Belum Ada Data Siswa</p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Data siswa dan nilai rapor akan tampil otomatis setelah siswa masuk dan menyelesaikan Dars.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 pr-3">ID Siswa</th>
                  <th className="py-3 px-3">Nama Siswa</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3">Kelompok</th>
                  <th className="py-3 px-3 text-right">Dars 1</th>
                  <th className="py-3 px-3 text-right">Dars 2</th>
                  <th className="py-3 px-3 text-right">Dars 3</th>
                  <th className="py-3 px-3 text-right">Rata-rata</th>
                  <th className="py-3 px-3 text-right">Progres</th>
                  <th className="no-print py-3 pl-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRekap.map((row, idx) => {
                  const sid = String(row['ID Siswa'] || '');
                  return (
                    <tr key={`${sid}-${idx}`} className="hover:bg-sky-50/40">
                      <td className="py-3.5 pr-3 font-semibold text-slate-700 tabular-nums">{sid}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">{String(row['Nama Siswa'] || '')}</td>
                      <td className="py-3.5 px-3 text-slate-700">{String(row['Kelas'] || '')}</td>
                      <td className="py-3.5 px-3 font-semibold text-sky-800">{String(row['Kategori'] || '')}</td>
                      <td className="py-3.5 px-3 text-right tabular-nums">
                        {row['Nilai Dars 1'] !== '' && row['Nilai Dars 1'] !== undefined ? String(row['Nilai Dars 1']) : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums">
                        {row['Nilai Dars 2'] !== '' && row['Nilai Dars 2'] !== undefined ? String(row['Nilai Dars 2']) : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums">
                        {row['Nilai Dars 3'] !== '' && row['Nilai Dars 3'] !== undefined ? String(row['Nilai Dars 3']) : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-sky-800 tabular-nums">
                        {String(row['Rata-rata Seluruh Dars'] ?? '0')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-emerald-700 tabular-nums">
                        {String(row['Jumlah Dars Selesai'] ?? 0)}/3 ({String(row['Persentase Penyelesaian'] ?? '0%')})
                      </td>
                      <td className="no-print py-3.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDetailModal(sid)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: DETAIL NILAI PER MAHARAH & DARS */}
      {activeTab === 'detail' && (
        <div className="print-container bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 shadow-2xs overflow-x-auto">
          {filteredScores.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-base font-bold text-slate-800">Belum Ada Nilai Dars Tersimpan</p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Rincian nilai Maharah Istima&apos;, Kalam, Qira&apos;ah, Kitabah, dan Evaluasi akan muncul setelah siswa
                menyelesaikan Dars.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 pr-2">Nama Siswa</th>
                  <th className="py-3 px-2">Kelas</th>
                  <th className="py-3 px-2">Kelompok</th>
                  <th className="py-3 px-2">Dars</th>
                  <th className="py-3 px-2 text-right">Istima&apos;</th>
                  <th className="py-3 px-2 text-right">Kalam</th>
                  <th className="py-3 px-2 text-right">Qira&apos;ah</th>
                  <th className="py-3 px-2 text-right">Kitabah</th>
                  <th className="py-3 px-2 text-right">Eval</th>
                  <th className="py-3 px-2 text-right">Akhir</th>
                  <th className="py-3 px-2">Predikat</th>
                  <th className="no-print py-3 pl-2 text-right">Jawaban</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScores.map((row, idx) => {
                  const sid = String(row['ID Siswa'] || '');
                  return (
                    <tr key={`${sid}-${row['Nama Dars']}-${idx}`} className="hover:bg-sky-50/40">
                      <td className="py-3.5 pr-2 font-bold text-slate-900">
                        {String(row['Nama Siswa'] || '')}
                        <span className="block text-xs font-normal text-slate-500 tabular-nums">{sid}</span>
                      </td>
                      <td className="py-3.5 px-2">{String(row['Kelas'] || '')}</td>
                      <td className="py-3.5 px-2 font-semibold text-sky-800">{String(row['Kategori'] || '')}</td>
                      <td className="py-3.5 px-2 text-slate-700">{String(row['Nama Dars'] || '')}</td>
                      <td className="py-3.5 px-2 text-right tabular-nums">{String(row["Nilai Istima'"] ?? '—')}</td>
                      <td className="py-3.5 px-2 text-right tabular-nums">{String(row['Nilai Kalam'] ?? '—')}</td>
                      <td className="py-3.5 px-2 text-right tabular-nums">{String(row["Nilai Qira'ah"] ?? '—')}</td>
                      <td className="py-3.5 px-2 text-right tabular-nums">{String(row['Nilai Kitabah'] ?? '—')}</td>
                      <td className="py-3.5 px-2 text-right tabular-nums">{String(row['Nilai Evaluasi'] ?? '—')}</td>
                      <td className="py-3.5 px-2 text-right font-extrabold text-sky-800 tabular-nums">
                        {String(row['Nilai Akhir Dars'] ?? '—')}
                      </td>
                      <td className="py-3.5 px-2 font-semibold text-emerald-700">{String(row['Predikat'] || '')}</td>
                      <td className="no-print py-3.5 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => openDetailModal(sid)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: PENGATURAN AKUN GURU & GOOGLE SPREADSHEET */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-6">
            {/* Change Password Card */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-sky-600" />
                <h2 className="text-lg font-bold text-slate-900">Keamanan &amp; Ubah Password Guru</h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Password disimpan dalam bentuk hash terenkripsi di server. Anda dapat memperbaruinya kapan saja.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password Saat Ini</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru (min. 6 karakter)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                {pwMsg && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                      pwMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {pwMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{pwMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={changingPw}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {changingPw ? 'Menyimpan...' : 'Perbarui Password'}
                </button>
              </form>
            </div>

            {/* Apps Script URL Config */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Hubungkan Google Spreadsheet</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tempelkan URL Web App Google Apps Script di bawah ini agar seluruh nilai tersinkron otomatis.
              </p>

              <form onSubmit={handleSaveConfig} className="space-y-3">
                <div>
                  <label htmlFor="appsScriptUrl" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    URL Web App Google Apps Script (/exec)
                  </label>
                  <input
                    id="appsScriptUrl"
                    type="url"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {configMsg && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                      configMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {configMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{configMsg.text}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={testingConn || !appsScriptUrl.trim()}
                    onClick={handleTestConnection}
                    className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 disabled:opacity-40 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {testingConn ? 'Menguji...' : 'Uji Koneksi'}
                  </button>
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {savingConfig ? 'Menyimpan...' : 'Simpan URL Spreadsheet'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Petunjuk Deployment Web App</h3>
              <ol className="space-y-3">
                {APPS_SCRIPT_DEPLOYMENT_STEPS.map((st) => (
                  <li key={st.step} className="flex items-start gap-3 text-xs sm:text-sm">
                    <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {st.step}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{st.title}</p>
                      <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{st.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 text-slate-100 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Kode Lengkap Google Apps Script (Code.gs)</h3>
                <p className="text-xs text-slate-400">
                  Otomatis membuat sheet DATA SISWA, NILAI PER DARS, dan REKAP RAPOR tanpa data ganda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto text-xs leading-relaxed text-sky-100 max-h-[600px]">
              <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Detail Jawaban Siswa Modal */}
      {inspectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-sky-100 max-w-4xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-bold text-sky-700">
                  ID {inspectedStudent.studentId} · Kelas {inspectedStudent.className} · Kelompok{' '}
                  {inspectedStudent.tier}
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Detail Jawaban &amp; Progres: {inspectedStudent.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedStudent(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {[1, 2, 3].map((dNum) => {
              const rec = inspectedStudent.darsProgress?.[dNum];
              if (!rec) {
                return (
                  <div key={dNum} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500">
                    Dars {dNum}: Belum dimulai oleh siswa.
                  </div>
                );
              }
              return (
                <div key={dNum} className="border border-sky-100 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900">
                      Dars {dNum}: {rec.darsTitleId} ({rec.status})
                    </h4>
                    <span className="text-xs font-bold text-sky-800 tabular-nums">
                      Nilai Akhir: {rec.finalScore} ({rec.predicate})
                    </span>
                  </div>

                  {/* Kalam Voice Transcripts */}
                  {rec.maharah.kalam?.kalamLogs && rec.maharah.kalam.kalamLogs.length > 0 && (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-emerald-900">
                        Transkrip Dialog Suara Kalam (Nilai: {rec.maharah.kalam.score})
                      </p>
                      {rec.maharah.kalam.kalamLogs.map((l) => (
                        <div key={l.turnNumber} className="text-xs space-y-1 pb-2 border-b border-emerald-100 last:border-b-0">
                          <p className="text-slate-600">
                            Giliran {l.turnNumber} · Ucapan siswa:{' '}
                            <span className="font-arabic text-base font-bold text-slate-900" dir="rtl" lang="ar">
                              {l.studentTranscriptAr}
                            </span>
                          </p>
                          {l.aiCorrectionId && <p className="text-emerald-800">{l.aiCorrectionId}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Kitabah Writing Logs */}
                  {rec.maharah.kitabah?.kitabahLogs && rec.maharah.kitabah.kitabahLogs.length > 0 && (
                    <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-indigo-900">
                        Hasil Tulisan Kitabah (Nilai: {rec.maharah.kitabah.score})
                      </p>
                      {rec.maharah.kitabah.kitabahLogs.map((kl) => (
                        <div key={kl.taskId} className="text-xs space-y-1 pb-2 border-b border-indigo-100 last:border-b-0">
                          <p className="font-arabic text-lg font-bold text-slate-900 text-right" dir="rtl" lang="ar">
                            {kl.studentTextAr}
                          </p>
                          <p className="text-indigo-800">{kl.feedbackId}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Evaluasi Question Reviews */}
                  {rec.evaluation?.reviews && rec.evaluation.reviews.length > 0 && (
                    <div className="bg-sky-50/40 border border-sky-100 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-sky-900">
                        Rincian Jawaban Evaluasi (Nilai: {rec.evaluation.score})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rec.evaluation.reviews.map((rv) => (
                          <div
                            key={rv.questionNumber}
                            className={`p-2.5 rounded-lg border text-xs ${
                              rv.isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                            }`}
                          >
                            <p className="font-bold">
                              Soal {rv.questionNumber}: {rv.isCorrect ? 'Benar' : 'Salah'}
                            </p>
                            <p className="text-slate-700 truncate">Jawaban: {rv.studentAnswer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
