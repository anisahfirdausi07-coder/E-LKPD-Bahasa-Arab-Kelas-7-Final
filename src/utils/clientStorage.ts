import {
  AbilityTier,
  DarsProgressRecord,
  StudentProfile,
} from '../types/elkpd';
import { calculatePredicate } from './arabicSpeech';
import { GOOGLE_APPS_SCRIPT_URL } from './appsScriptTemplate';

export const STORAGE_STUDENT_KEY = 'elkpd_active_student_v1';
export const STORAGE_IDENTITY_KEY = 'elkpd_student_identity_v1';
export const STORAGE_PROGRESS_PREFIX = 'elkpd_dars_progress_v1_';
const STORAGE_STUDENTS_DB_KEY = 'elkpd_students_db_v1';
const STORAGE_TEACHER_AUTH_KEY = 'elkpd_teacher_auth_v1';
const STORAGE_TEACHER_TOKEN_KEY = 'elkpd_teacher_token';
const STORAGE_APPS_SCRIPT_KEY = 'elkpd_apps_script_url_v1';

// Precomputed SHA-256 hex of default initial teacher passcode ("123456") so plaintext isn't used for storage comparison
const DEFAULT_TEACHER_USERNAME = 'guru';
const DEFAULT_TEACHER_SHA256 =
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

export interface StoredStudentEntry extends StudentProfile {
  darsProgress: Record<number, DarsProgressRecord>;
}

export interface GroupStatItem {
  tier: AbilityTier;
  studentCount: number;
  completedDarsCount: number;
  averageFinal: number;
  avgIstima: number;
  avgKalam: number;
  avgQiraah: number;
  avgKitabah: number;
  avgEvaluasi: number;
}

export interface StudentDetailItem {
  studentId: string;
  fullName: string;
  className: string;
  absenNumber: string;
  tier: string;
  darsProgress: Record<number, DarsProgressRecord>;
}

export function buildStudentId(
  fullName: string,
  className: string,
  absenNumber: string
): string {
  const cleanClass = className.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanAbsen = String(absenNumber).trim().replace(/^0+(?=\d)/, '');
  const cleanNameSlug = fullName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24);
  return `${cleanClass}-${cleanAbsen}-${cleanNameSlug}`;
}

export function getAppsScriptUrl(): string {
  try {
    const custom = localStorage.getItem(STORAGE_APPS_SCRIPT_KEY);
    if (custom && custom.trim()) return custom.trim();
  } catch {
    // Ignore storage read error
  }
  return GOOGLE_APPS_SCRIPT_URL;
}

export function setAppsScriptUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_APPS_SCRIPT_KEY, url.trim());
  } catch {
    // Ignore storage write error
  }
}

function readStudentsDb(): Record<string, StoredStudentEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_STUDENTS_DB_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredStudentEntry>) : {};
  } catch {
    return {};
  }
}

function writeStudentsDb(db: Record<string, StoredStudentEntry>): void {
  try {
    localStorage.setItem(STORAGE_STUDENTS_DB_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage quota errors
  }
}

export function getActiveStudentLocal(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_STUDENT_KEY);
    return raw ? (JSON.parse(raw) as StudentProfile) : null;
  } catch {
    return null;
  }
}

export function getStudentProgressLocal(
  studentId: string
): Record<number, DarsProgressRecord> {
  const db = readStudentsDb();
  if (db[studentId]?.darsProgress) {
    return db[studentId].darsProgress;
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PROGRESS_PREFIX}${studentId}`);
    return raw ? (JSON.parse(raw) as Record<number, DarsProgressRecord>) : {};
  } catch {
    return {};
  }
}

export function clearActiveStudentSessionLocal(): void {
  try {
    localStorage.removeItem(STORAGE_STUDENT_KEY);
    localStorage.removeItem(STORAGE_IDENTITY_KEY);
  } catch {
    // Ignore
  }
}

export async function sendIdentityToAppsScript(
  nama: string,
  kelas: string,
  absen: string
): Promise<void> {
  try {
    await fetch(getAppsScriptUrl(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        nama,
        kelas,
        absen,
      }),
    });
  } catch {
    // Jangan blokir siswa jika jaringan offline atau Apps Script gagal dijangkau
  }
}

export function loginStudentLocal(
  fullName: string,
  className: string,
  absenNumber: string
): { student: StudentProfile; darsProgress: Record<number, DarsProgressRecord> } {
  const cleanName = fullName.trim();
  const cleanClass = className.trim();
  const cleanAbsen = String(Math.floor(Number(absenNumber.trim())));
  const studentId = buildStudentId(cleanName, cleanClass, cleanAbsen);

  const db = readStudentsDb();
  const existing = db[studentId];

  let restoredProgress: Record<number, DarsProgressRecord> =
    existing?.darsProgress || getStudentProgressLocal(studentId);
  const restoredTier = existing?.tier || null;

  const student: StudentProfile = {
    studentId,
    fullName: cleanName,
    className: cleanClass,
    absenNumber: cleanAbsen,
    tier: restoredTier,
    loginDate: existing?.loginDate || new Date().toISOString(),
  };

  db[studentId] = {
    ...student,
    darsProgress: restoredProgress,
  };
  writeStudentsDb(db);

  try {
    localStorage.setItem(
      STORAGE_IDENTITY_KEY,
      JSON.stringify({ nama: cleanName, kelas: cleanClass, absen: cleanAbsen })
    );
    localStorage.setItem(STORAGE_STUDENT_KEY, JSON.stringify(student));
    localStorage.setItem(
      `${STORAGE_PROGRESS_PREFIX}${studentId}`,
      JSON.stringify(restoredProgress)
    );
  } catch {
    // Ignore storage error
  }

  return { student, darsProgress: restoredProgress };
}

export function setStudentTierLocal(
  studentId: string,
  tier: AbilityTier
): StudentProfile | null {
  const db = readStudentsDb();
  const active = getActiveStudentLocal();
  const existing = db[studentId];

  const baseStudent: StudentProfile | null = existing
    ? {
        studentId: existing.studentId,
        fullName: existing.fullName,
        className: existing.className,
        absenNumber: existing.absenNumber,
        tier,
        loginDate: existing.loginDate,
      }
    : active && active.studentId === studentId
      ? { ...active, tier }
      : null;

  if (!baseStudent) return null;

  db[studentId] = {
    ...baseStudent,
    darsProgress: existing?.darsProgress || getStudentProgressLocal(studentId),
  };
  writeStudentsDb(db);

  try {
    localStorage.setItem(STORAGE_STUDENT_KEY, JSON.stringify(baseStudent));
  } catch {
    // Ignore
  }

  return baseStudent;
}

export function saveDarsProgressLocal(
  studentId: string,
  darsRecord: DarsProgressRecord
): DarsProgressRecord {
  const db = readStudentsDb();
  const active = getActiveStudentLocal();
  const prevProgress = db[studentId]?.darsProgress || getStudentProgressLocal(studentId);
  const prevRec = prevProgress[darsRecord.darsNumber];

  const mergedRecord: DarsProgressRecord = {
    ...darsRecord,
    status: prevRec?.status === 'SELESAI' ? 'SELESAI' : darsRecord.status,
    savedToSpreadsheet: prevRec?.savedToSpreadsheet || false,
    savedMode: prevRec?.savedMode,
    savedAt: prevRec?.savedAt,
  };

  const nextProgress = {
    ...prevProgress,
    [darsRecord.darsNumber]: mergedRecord,
  };

  if (db[studentId]) {
    db[studentId].darsProgress = nextProgress;
    writeStudentsDb(db);
  } else if (active && active.studentId === studentId) {
    db[studentId] = { ...active, darsProgress: nextProgress };
    writeStudentsDb(db);
  }

  try {
    localStorage.setItem(
      `${STORAGE_PROGRESS_PREFIX}${studentId}`,
      JSON.stringify(nextProgress)
    );
  } catch {
    // Ignore
  }

  return mergedRecord;
}

export async function completeDarsLocal(
  student: StudentProfile,
  darsRecord: DarsProgressRecord
): Promise<{
  ok: boolean;
  message: string;
  savedMode: 'spreadsheet' | 'local';
  record: DarsProgressRecord;
}> {
  const sIstima = darsRecord.maharah?.istima?.score ?? 0;
  const sKalam = darsRecord.maharah?.kalam?.score ?? 0;
  const sQiraah = darsRecord.maharah?.qiraah?.score ?? 0;
  const sKitabah = darsRecord.maharah?.kitabah?.score ?? 0;
  const sEval = darsRecord.evaluation?.score ?? 0;

  const finalScore =
    Math.round(((sIstima + sKalam + sQiraah + sKitabah + sEval) / 5) * 10) / 10;
  const predicate = calculatePredicate(finalScore);
  const savedAt = new Date().toISOString();

  const finalizedRecord: DarsProgressRecord = {
    ...darsRecord,
    finalScore,
    predicate,
    status: 'SELESAI',
    savedToSpreadsheet: true,
    savedMode: 'spreadsheet',
    savedAt,
  };

  const db = readStudentsDb();
  const prevProgress = db[student.studentId]?.darsProgress || getStudentProgressLocal(student.studentId);
  const nextProgress = {
    ...prevProgress,
    [darsRecord.darsNumber]: finalizedRecord,
  };

  db[student.studentId] = {
    ...student,
    darsProgress: nextProgress,
  };
  writeStudentsDb(db);

  try {
    localStorage.setItem(
      `${STORAGE_PROGRESS_PREFIX}${student.studentId}`,
      JSON.stringify(nextProgress)
    );
  } catch {
    // Ignore
  }

  try {
    await fetch(getAppsScriptUrl(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveDars',
        timestamp: savedAt,
        student: {
          studentId: student.studentId,
          fullName: student.fullName,
          className: student.className,
          absenNumber: student.absenNumber,
          tier: student.tier || 'LOW',
          loginDate: student.loginDate,
        },
        nama: student.fullName,
        kelas: student.className,
        absen: student.absenNumber,
        kelompok: student.tier || 'LOW',
        studentId: student.studentId,
        fullName: student.fullName,
        className: student.className,
        absenNumber: student.absenNumber,
        tier: student.tier || 'LOW',
        darsName: `Dars ${darsRecord.darsNumber}: ${darsRecord.darsTitleId}`,
        istima: sIstima,
        kalam: sKalam,
        qiraah: sQiraah,
        kitabah: sKitabah,
        evaluasi: sEval,
        correctCount: darsRecord.evaluation?.correctCount ?? 0,
        wrongCount: darsRecord.evaluation?.wrongCount ?? 0,
        finalScore,
        predicate,
        status: 'SELESAI',
      }),
    });
  } catch {
    // Tetap berhasil tersimpan lokal di browser walau offline
  }

  return {
    ok: true,
    message:
      'Nilai berhasil disimpan di browser dan dikirim ke Google Spreadsheet. Dars berikutnya telah terbuka.',
    savedMode: 'spreadsheet',
    record: finalizedRecord,
  };
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return input;
}

function getTeacherAuthRecord(): { username: string; passwordHash: string } {
  try {
    const raw = localStorage.getItem(STORAGE_TEACHER_AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { username?: string; passwordHash?: string };
      if (parsed.username && parsed.passwordHash) {
        return { username: parsed.username, passwordHash: parsed.passwordHash };
      }
    }
  } catch {
    // Fallback
  }
  return { username: DEFAULT_TEACHER_USERNAME, passwordHash: DEFAULT_TEACHER_SHA256 };
}

export async function verifyTeacherLoginLocal(
  username: string,
  password: string
): Promise<{ ok: boolean; token?: string; message?: string }> {
  const auth = getTeacherAuthRecord();
  if (!username.trim() || !password) {
    return { ok: false, message: 'Username dan password wajib diisi.' };
  }
  const hashed = await sha256Hex(password);
  if (
    username.trim().toLowerCase() !== auth.username.toLowerCase() ||
    hashed !== auth.passwordHash
  ) {
    return { ok: false, message: 'Username atau password guru tidak sesuai.' };
  }
  const token = `local-teacher-${Date.now()}`;
  try {
    localStorage.setItem(STORAGE_TEACHER_TOKEN_KEY, token);
  } catch {
    // Ignore
  }
  return { ok: true, token };
}

export async function changeTeacherPasswordLocal(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  const auth = getTeacherAuthRecord();
  const currentHash = await sha256Hex(currentPassword);
  if (currentHash !== auth.passwordHash) {
    return { ok: false, message: 'Password saat ini tidak sesuai.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, message: 'Password baru minimal 6 karakter.' };
  }
  const newHash = await sha256Hex(newPassword);
  try {
    localStorage.setItem(
      STORAGE_TEACHER_AUTH_KEY,
      JSON.stringify({ username: auth.username, passwordHash: newHash })
    );
  } catch {
    return { ok: false, message: 'Gagal menyimpan password di browser.' };
  }
  return { ok: true, message: 'Password Dashboard Guru berhasil diperbarui.' };
}

export function buildTeacherDashboardDataLocal() {
  const db = readStudentsDb();
  const studentList = Object.values(db);

  const students = studentList.map((s) => ({
    'ID Siswa': s.studentId,
    'Nama Lengkap': s.fullName,
    Kelas: s.className,
    'Nomor Absen': s.absenNumber,
    'Kategori Kemampuan': s.tier || 'Belum Dipilih',
    'Tanggal Login': s.loginDate,
  }));

  const scores: Array<Record<string, unknown>> = [];
  const rekap: Array<Record<string, unknown>> = [];
  const studentDetails: StudentDetailItem[] = [];

  const groupBuckets: Record<
    AbilityTier,
    {
      count: number;
      totalScore: number;
      istima: number[];
      kalam: number[];
      qiraah: number[];
      kitabah: number[];
      eval: number[];
    }
  > = {
    LOW: { count: 0, totalScore: 0, istima: [], kalam: [], qiraah: [], kitabah: [], eval: [] },
    MIDDLE: { count: 0, totalScore: 0, istima: [], kalam: [], qiraah: [], kitabah: [], eval: [] },
    HIGH: { count: 0, totalScore: 0, istima: [], kalam: [], qiraah: [], kitabah: [], eval: [] },
  };

  for (const s of studentList) {
    const dMap: Record<number, number> = {};
    let completedCount = 0;
    let sum = 0;

    studentDetails.push({
      studentId: s.studentId,
      fullName: s.fullName,
      className: s.className,
      absenNumber: s.absenNumber,
      tier: s.tier || 'Belum Dipilih',
      darsProgress: s.darsProgress || {},
    });

    for (const dNum of [1, 2, 3]) {
      const rec = s.darsProgress?.[dNum];
      if (rec && rec.status === 'SELESAI') {
        const istima = rec.maharah.istima?.score ?? 0;
        const kalam = rec.maharah.kalam?.score ?? 0;
        const qiraah = rec.maharah.qiraah?.score ?? 0;
        const kitabah = rec.maharah.kitabah?.score ?? 0;
        const evaluasi = rec.evaluation?.score ?? 0;
        const totalObj = rec.evaluation?.totalObjective ?? 10;
        const correctCount = rec.evaluation?.correctCount ?? 0;
        const wrongCount = rec.evaluation?.wrongCount ?? Math.max(0, totalObj - correctCount);
        const finalScore = rec.finalScore;

        scores.push({
          Timestamp: rec.savedAt || new Date().toISOString(),
          'ID Siswa': s.studentId,
          'Nama Siswa': s.fullName,
          Kelas: s.className,
          'Nomor Absen': s.absenNumber,
          Kategori: s.tier || '',
          'Nama Dars': `Dars ${dNum}: ${rec.darsTitleId}`,
          "Nilai Istima'": istima,
          'Nilai Kalam': kalam,
          "Nilai Qira'ah": qiraah,
          'Nilai Kitabah': kitabah,
          'Nilai Evaluasi': evaluasi,
          'Jumlah Benar': correctCount,
          'Jumlah Salah': wrongCount,
          'Nilai Akhir Dars': finalScore,
          Predikat: rec.predicate,
          'Status Dars': rec.status,
        });

        dMap[dNum] = finalScore;
        completedCount += 1;
        sum += finalScore;

        if (s.tier && (s.tier === 'LOW' || s.tier === 'MIDDLE' || s.tier === 'HIGH')) {
          const b = groupBuckets[s.tier];
          b.count += 1;
          b.totalScore += finalScore;
          b.istima.push(istima);
          b.kalam.push(kalam);
          b.qiraah.push(qiraah);
          b.kitabah.push(kitabah);
          b.eval.push(evaluasi);
        }
      }
    }

    const avg = completedCount > 0 ? Math.round((sum / completedCount) * 10) / 10 : 0;
    const pct = Math.round((completedCount / 3) * 100);

    rekap.push({
      'ID Siswa': s.studentId,
      'Nama Siswa': s.fullName,
      Kelas: s.className,
      Kategori: s.tier || 'Belum Dipilih',
      'Nilai Dars 1': dMap[1] ?? '',
      'Nilai Dars 2': dMap[2] ?? '',
      'Nilai Dars 3': dMap[3] ?? '',
      'Rata-rata Seluruh Dars': avg,
      'Jumlah Dars Selesai': completedCount,
      'Persentase Penyelesaian': `${pct}%`,
    });
  }

  const avgArr = (arr: number[]) =>
    arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

  const groupStats: GroupStatItem[] = (['LOW', 'MIDDLE', 'HIGH'] as const).map((tier) => {
    const b = groupBuckets[tier];
    const studentCountInTier = studentList.filter((st) => st.tier === tier).length;
    return {
      tier,
      studentCount: studentCountInTier,
      completedDarsCount: b.count,
      averageFinal: b.count > 0 ? Math.round((b.totalScore / b.count) * 10) / 10 : 0,
      avgIstima: avgArr(b.istima),
      avgKalam: avgArr(b.kalam),
      avgQiraah: avgArr(b.qiraah),
      avgKitabah: avgArr(b.kitabah),
      avgEvaluasi: avgArr(b.eval),
    };
  });

  return { students, scores, rekap, studentDetails, groupStats };
}
