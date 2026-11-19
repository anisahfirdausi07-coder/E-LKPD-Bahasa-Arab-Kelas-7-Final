export const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyOveRhNxl0cFUjcb0Krkt2ysJagsGPu53LKxlPSIudQiRTm2ytV8D0H8dn8til06PxKw/exec';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT WEB APP BACKEND
 * E-LKPD Bahasa Arab Kelas VII MTs Semester 1 (هَيَّا نَتَعَلَّمُ!)
 *
 * Sheet yang dikelola otomatis:
 * 1. DATA SISWA
 * 2. NILAI PER DARS
 * 3. REKAP RAPOR
 */

var SHEET_SISWA = "DATA SISWA";
var SHEET_NILAI = "NILAI PER DARS";
var SHEET_REKAP = "REKAP RAPOR";

function ensureSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var s1 = ss.getSheetByName(SHEET_SISWA);
  if (!s1) {
    s1 = ss.insertSheet(SHEET_SISWA);
    s1.appendRow([
      "ID Siswa",
      "Nama Lengkap",
      "Kelas",
      "Nomor Absen",
      "Kategori Kemampuan",
      "Tanggal Login"
    ]);
    s1.getRange("1:1").setFontWeight("bold").setBackground("#E0F2FE");
  }

  var s2 = ss.getSheetByName(SHEET_NILAI);
  if (!s2) {
    s2 = ss.insertSheet(SHEET_NILAI);
    s2.appendRow([
      "Timestamp",
      "ID Siswa",
      "Nama Siswa",
      "Kelas",
      "Nomor Absen",
      "Kategori",
      "Nama Dars",
      "Nilai Istima'",
      "Nilai Kalam",
      "Nilai Qira'ah",
      "Nilai Kitabah",
      "Nilai Evaluasi",
      "Jumlah Benar",
      "Jumlah Salah",
      "Nilai Akhir Dars",
      "Predikat",
      "Status Dars"
    ]);
    s2.getRange("1:1").setFontWeight("bold").setBackground("#E0F2FE");
  }

  var s3 = ss.getSheetByName(SHEET_REKAP);
  if (!s3) {
    s3 = ss.insertSheet(SHEET_REKAP);
    s3.appendRow([
      "ID Siswa",
      "Nama Siswa",
      "Kelas",
      "Kategori",
      "Nilai Dars 1",
      "Nilai Dars 2",
      "Nilai Dars 3",
      "Rata-rata Seluruh Dars",
      "Jumlah Dars Selesai",
      "Persentase Penyelesaian"
    ]);
    s3.getRange("1:1").setFontWeight("bold").setBackground("#E0F2FE");
  }

  return { s1: s1, s2: s2, s3: s3 };
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
    var sheets = ensureSheets_();

    if (action === "ping") {
      return jsonOut({
        status: "success",
        message: "Koneksi Google Spreadsheet E-LKPD aktif.",
        timestamp: new Date().toISOString()
      });
    }

    if (action === "getAll") {
      return jsonOut({
        status: "success",
        students: sheetToObjects_(sheets.s1),
        scores: sheetToObjects_(sheets.s2),
        rekap: sheetToObjects_(sheets.s3)
      });
    }

    return jsonOut({ status: "error", message: "Action tidak dikenali" });
  } catch (err) {
    return jsonOut({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheets = ensureSheets_();
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var payload = JSON.parse(raw);

    if (!payload.action && (payload.nama || payload.fullName)) {
      var cleanNama = String(payload.nama || payload.fullName || "").trim();
      var cleanKelas = String(payload.kelas || payload.className || "").trim();
      var cleanAbsen = String(payload.absen || payload.absenNumber || "").trim();
      var cleanTier = String(payload.kelompok || payload.tier || "").trim();
      var generatedId = (cleanKelas + "-" + cleanAbsen + "-" + cleanNama).toUpperCase().replace(/[^A-Z0-9-]/g, "");
      upsertStudent_(sheets.s1, {
        studentId: payload.studentId || generatedId,
        fullName: cleanNama,
        className: cleanKelas,
        absenNumber: cleanAbsen,
        tier: cleanTier,
        loginDate: new Date().toISOString()
      });
      return jsonOut({ status: "success", message: "Identitas siswa tersimpan" });
    }

    var action = payload.action || "saveDars";

    if (action === "login") {
      upsertStudent_(sheets.s1, payload.student);
      return jsonOut({ status: "success", message: "Data siswa tersimpan" });
    }

    if (action === "saveDars") {
      if (payload.student) {
        upsertStudent_(sheets.s1, payload.student);
      }
      upsertDarsScore_(sheets.s2, payload);
      recomputeRekap_(sheets.s1, sheets.s2, sheets.s3, payload.studentId);
      return jsonOut({
        status: "success",
        message: "Nilai dars berhasil disimpan ke Google Spreadsheet",
        savedAt: new Date().toISOString()
      });
    }

    return jsonOut({ status: "error", message: "Action POST tidak valid" });
  } catch (err) {
    return jsonOut({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function upsertStudent_(sheet, student) {
  if (!student || !student.studentId) return;
  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(student.studentId)) {
      rowIndex = i + 1;
      break;
    }
  }
  var rowData = [
    student.studentId,
    student.fullName,
    student.className,
    student.absenNumber,
    student.tier || "",
    student.loginDate || new Date().toISOString()
  ];
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function upsertDarsScore_(sheet, payload) {
  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (
      String(values[i][1]) === String(payload.studentId) &&
      String(values[i][5]) === String(payload.tier) &&
      String(values[i][6]) === String(payload.darsName)
    ) {
      rowIndex = i + 1;
      break;
    }
  }
  var rowData = [
    payload.timestamp || new Date().toISOString(),
    payload.studentId,
    payload.fullName,
    payload.className,
    payload.absenNumber || "",
    payload.tier,
    payload.darsName,
    Number(payload.istima),
    Number(payload.kalam),
    Number(payload.qiraah),
    Number(payload.kitabah),
    Number(payload.evaluasi),
    Number(payload.correctCount),
    Number(payload.wrongCount),
    Number(payload.finalScore),
    payload.predicate,
    payload.status || "SELESAI"
  ];
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function recomputeRekap_(s1, s2, s3, studentId) {
  var students = s1.getDataRange().getValues();
  var scores = s2.getDataRange().getValues();
  var rekapRows = s3.getDataRange().getValues();

  var studentInfo = null;
  for (var i = 1; i < students.length; i++) {
    if (String(students[i][0]) === String(studentId)) {
      studentInfo = students[i];
      break;
    }
  }
  if (!studentInfo) return;

  var darsMap = {};
  for (var j = 1; j < scores.length; j++) {
    if (String(scores[j][1]) === String(studentId)) {
      var dName = String(scores[j][6]);
      var fScore = Number(scores[j][14]) || 0;
      if (dName.indexOf("1") !== -1) darsMap[1] = fScore;
      else if (dName.indexOf("2") !== -1) darsMap[2] = fScore;
      else if (dName.indexOf("3") !== -1) darsMap[3] = fScore;
    }
  }

  var totalDars = 3;
  var completed = 0;
  var sum = 0;
  [1, 2, 3].forEach(function (num) {
    if (typeof darsMap[num] === "number") {
      completed++;
      sum += darsMap[num];
    }
  });
  var avg = completed > 0 ? Math.round((sum / completed) * 10) / 10 : 0;
  var pct = Math.round((completed / totalDars) * 100);

  var rowData = [
    studentId,
    studentInfo[1],
    studentInfo[2],
    studentInfo[4],
    darsMap[1] !== undefined ? darsMap[1] : "",
    darsMap[2] !== undefined ? darsMap[2] : "",
    darsMap[3] !== undefined ? darsMap[3] : "",
    avg,
    completed,
    pct + "%"
  ];

  var rowIndex = -1;
  for (var k = 1; k < rekapRows.length; k++) {
    if (String(rekapRows[k][0]) === String(studentId)) {
      rowIndex = k + 1;
      break;
    }
  }
  if (rowIndex > 0) {
    s3.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    s3.appendRow(rowData);
  }
}

function sheetToObjects_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var list = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[String(headers[c])] = data[i][c];
    }
    list.push(obj);
  }
  return list;
}
`;

export const APPS_SCRIPT_DEPLOYMENT_STEPS = [
  {
    step: 1,
    title: 'Buat Google Spreadsheet Baru',
    detail:
      'Buka Google Drive / Google Sheets, buat spreadsheet baru dengan nama misalnya "Database E-LKPD Bahasa Arab Kelas VII". Biarkan kosong karena 3 sheet (DATA SISWA, NILAI PER DARS, REKAP RAPOR) akan dibuat otomatis oleh skrip.',
  },
  {
    step: 2,
    title: 'Buka Editor Apps Script',
    detail:
      'Di Google Spreadsheet tersebut, klik menu Ekstensi (Extensions) > Apps Script. Hapus kode bawaan di file Code.gs, lalu tempel (paste) seluruh kode Google Apps Script dari halaman ini.',
  },
  {
    step: 3,
    title: 'Deploy sebagai Web App',
    detail:
      'Klik tombol Terapkan (Deploy) > Deployment baru (New deployment). Pilih jenis "Aplikasi Web" (Web app). Pada bagian "Yang memiliki akses" (Who has access), pilih "Siapa saja" (Anyone), lalu klik Terapkan dan berikan izin akses.',
  },
  {
    step: 4,
    title: 'Salin URL Web App & Hubungkan',
    detail:
      'Salin URL Web App yang berakhiran /exec, lalu tempel pada kolom URL Google Apps Script Web App di Portal Guru ini dan klik "Simpan & Uji Koneksi".',
  },
];
