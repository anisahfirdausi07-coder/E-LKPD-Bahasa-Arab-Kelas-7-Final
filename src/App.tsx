import { useState } from 'react';
import { AbilityTier, DarsProgressRecord, DarsStepId, StudentProfile } from './types/elkpd';
import { CURRICULUM_DARS } from './data/curriculum';
import { AppView, Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { DarsWorkspace } from './components/DarsWorkspace';
import { GlobalRaporView } from './components/GlobalRaporView';
import { TeacherPortal } from './components/TeacherPortal';
import { PetunjukPage } from './components/PetunjukPage';
import {
  clearActiveStudentSessionLocal,
  completeDarsLocal,
  getActiveStudentLocal,
  getAppsScriptUrl,
  getStudentProgressLocal,
  saveDarsProgressLocal,
  setStudentTierLocal,
} from './utils/clientStorage';

function createEmptyDarsRecord(darsNum: number): DarsProgressRecord {
  const def = CURRICULUM_DARS.find((d) => d.darsNumber === darsNum) || CURRICULUM_DARS[0];
  return {
    darsNumber: darsNum,
    darsTitleAr: def.titleAr,
    darsTitleId: def.titleId,
    visitedSteps: [],
    maharah: {},
    mahfudzatCompleted: false,
    finalScore: 0,
    predicate: 'Belum Lengkap',
    status: 'BELUM DIMULAI',
    savedToSpreadsheet: false,
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [student, setStudent] = useState<StudentProfile | null>(() => getActiveStudentLocal());
  const [darsProgress, setDarsProgress] = useState<Record<number, DarsProgressRecord>>(() => {
    const active = getActiveStudentLocal();
    return active?.studentId ? getStudentProgressLocal(active.studentId) : {};
  });
  const [activeDarsNumber, setActiveDarsNumber] = useState<number>(1);
  const [activeDarsInitialStep, setActiveDarsInitialStep] = useState<DarsStepId>('tujuan');
  const [spreadsheetConnected, setSpreadsheetConnected] = useState<boolean>(() =>
    Boolean(getAppsScriptUrl())
  );

  const handleLoginSuccess = (
    loggedInStudent: StudentProfile,
    progress: Record<number, DarsProgressRecord>
  ) => {
    setStudent(loggedInStudent);
    setDarsProgress(progress);
    if (loggedInStudent.tier) {
      setCurrentView('dashboard');
    }
  };

  const handleTierConfirmed = (tier: AbilityTier) => {
    if (!student) return;
    const updated = setStudentTierLocal(student.studentId, tier) || { ...student, tier };
    setStudent(updated);
    setCurrentView('dashboard');
  };

  const handleResetSessionOnly = () => {
    clearActiveStudentSessionLocal();
    setStudent(null);
    setDarsProgress({});
  };

  const handleLogoutStudent = () => {
    handleResetSessionOnly();
    setCurrentView('home');
  };

  const handleOpenDars = (darsNum: number, step: DarsStepId = 'tujuan') => {
    if (darsNum > 1 && darsProgress[darsNum - 1]?.status !== 'SELESAI') {
      return;
    }
    setActiveDarsNumber(darsNum);
    setActiveDarsInitialStep(step);
    setCurrentView('dars');
  };

  const handleUpdateDarsRecord = (updated: DarsProgressRecord) => {
    const persisted = student?.studentId
      ? saveDarsProgressLocal(student.studentId, updated)
      : updated;

    setDarsProgress((prev) => ({
      ...prev,
      [persisted.darsNumber]: persisted,
    }));
  };

  const handleCompleteDars = async (finalRecord: DarsProgressRecord) => {
    if (!student?.studentId || !student.tier) {
      return { ok: false, message: 'Sesi siswa tidak ditemukan. Silakan login ulang.' };
    }
    return completeDarsLocal(student, finalRecord);
  };

  const activeDarsDef =
    CURRICULUM_DARS.find((d) => d.darsNumber === activeDarsNumber) || CURRICULUM_DARS[0];
  const activeDarsRecord =
    darsProgress[activeDarsNumber] || createEmptyDarsRecord(activeDarsNumber);

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F8FF]">
      <Navbar
        currentView={currentView}
        student={student}
        onNavigate={(view) => {
          if ((view === 'dashboard' || view === 'evaluasi-hub') && (!student || !student.tier)) {
            setCurrentView('login');
          } else {
            setCurrentView(view);
          }
        }}
        onLogoutStudent={handleLogoutStudent}
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            student={student}
            onStartLearning={() => setCurrentView(student?.tier ? 'dashboard' : 'login')}
            onOpenTeacherPortal={() => setCurrentView('teacher')}
          />
        )}

        {currentView === 'login' && (
          <LoginPage
            existingStudent={student}
            onLoginSuccess={handleLoginSuccess}
            onTierConfirmed={handleTierConfirmed}
            onGoToLearning={() => setCurrentView('dashboard')}
            onResetSession={handleResetSessionOnly}
          />
        )}

        {currentView === 'petunjuk' && (
          <PetunjukPage
            student={student}
            onGoToLoginOrLearning={() => setCurrentView(student?.tier ? 'dashboard' : 'login')}
            onGoToEvaluasi={() => setCurrentView(student?.tier ? 'evaluasi-hub' : 'login')}
          />
        )}

        {currentView === 'dashboard' && student && student.tier && (
          <StudentDashboard
            student={student}
            darsProgress={darsProgress}
            onOpenDars={(dNum) => handleOpenDars(dNum, 'tujuan')}
            onOpenEvaluasiHub={() => setCurrentView('evaluasi-hub')}
            onChangeGroup={() => setCurrentView('login')}
          />
        )}

        {currentView === 'dars' && student && student.tier && (
          <DarsWorkspace
            student={student}
            dars={activeDarsDef}
            record={activeDarsRecord}
            spreadsheetConnected={spreadsheetConnected}
            hasNextDars={activeDarsNumber < CURRICULUM_DARS.length}
            initialStep={activeDarsInitialStep}
            onUpdateRecord={handleUpdateDarsRecord}
            onCompleteDars={handleCompleteDars}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onGoToNextDars={() => handleOpenDars(activeDarsNumber + 1, 'tujuan')}
          />
        )}

        {currentView === 'evaluasi-hub' && (
          <GlobalRaporView
            student={student}
            darsProgress={darsProgress}
            onBack={() => setCurrentView(student?.tier ? 'dashboard' : 'home')}
            onOpenDarsEvaluasi={(dNum) => handleOpenDars(dNum, 'evaluasi')}
          />
        )}

        {currentView === 'teacher' && (
          <TeacherPortal onSpreadsheetStatusChange={setSpreadsheetConnected} />
        )}
      </main>

      <footer className="no-print bg-white border-t border-sky-100 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3">
          <p className="font-arabic-classic text-xl font-bold text-sky-900" dir="rtl" lang="ar">
            هَيَّا نَتَعَلَّمُ! — الْكِتَابُ الإِضَافِيُّ الْإِلِكْتُرُونِيُّ
          </p>
          <p className="text-xs text-slate-500">
            E-LKPD Bahasa Arab Kelas VII MTs Semester 1 · MTsN 4 Sidoarjo
          </p>
          <div className="pt-2 border-t border-slate-100 w-full max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Tim Penyusun / Penulis
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs sm:text-sm font-medium text-slate-700">
              <span>1. Prof. Dr. Muflihah, S.Ag., M.A</span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">·</span>
              <span>2. Dr. H. Taufik, S. Ag., M. Pd. I.</span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">·</span>
              <span>3. Anisah Firdausi Nuzula</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
