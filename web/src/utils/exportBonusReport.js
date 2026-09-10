import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Export Society Bonus Summary Report (Tab 1: Summary, Tab 2: Zone)
 * Matches the official Kuapa Kokoo Bonus Summary Excel template.
 */
export const exportSocietyBonusReport = async (societyName, societySessions, allRecords, bonusRate = 1.12) => {
  const workbook = new ExcelJS.Workbook();
  
  // ==========================================
  // TAB 1: SUMMARY (Society Overview by Zone)
  // ==========================================
  const summarySheet = workbook.addWorksheet('Summary');

  summarySheet.columns = [
    { key: 'num', width: 8 },
    { key: 'zone', width: 28 },
    { key: 'members', width: 14 },
    { key: 'kilos', width: 18 },
    { key: 'bags', width: 16 },
    { key: 'bonus', width: 18 },
    { key: 'signature', width: 25 },
  ];

  // Row 1 & 2: Spacing for Logo
  summarySheet.getRow(1).height = 20;
  summarySheet.getRow(2).height = 20;

  // Row 3: Title
  summarySheet.mergeCells('A3:G3');
  const titleCell = summarySheet.getCell('A3');
  titleCell.value = 'KUAPA KOKOO COOPERATIVE COCOA FARMERS AND MARKETING UNION LIMITED';
  titleCell.font = { name: 'Times New Roman', size: 14, bold: true };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(3).height = 30;

  // Row 4: Subtitle 1
  summarySheet.mergeCells('A4:G4');
  const sub1Cell = summarySheet.getCell('A4');
  sub1Cell.value = 'BONUS PAYMENT';
  sub1Cell.font = { name: 'Times New Roman', size: 13, bold: true, italic: true };
  sub1Cell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(4).height = 22;

  // Row 5: Season Subtitle
  summarySheet.mergeCells('A5:G5');
  const sub2Cell = summarySheet.getCell('A5');
  sub2Cell.value = '2025/26 SEASON';
  sub2Cell.font = { name: 'Times New Roman', size: 13, bold: true, italic: true };
  sub2Cell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(5).height = 22;

  // Row 6: Society Name
  summarySheet.getRow(6).height = 32;
  const socCell = summarySheet.getCell('A6');
  socCell.value = societyName.toUpperCase();
  socCell.font = { name: 'Times New Roman', size: 14, bold: true };
  socCell.alignment = { vertical: 'bottom', horizontal: 'left' };

  // Row 7: Table Headers
  const headers = ['#', 'Zone', 'Members', 'Sum(Kilos)', 'Sum(Bags)', 'Sum Bonus', 'Signature'];
  const headerRow = summarySheet.getRow(7);
  headers.forEach((h, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = h;
    cell.font = { name: 'Times New Roman', size: 13, bold: true };
    if (index === 0 || index === 2) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (index === 3 || index === 4 || index === 5) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF000000' } }
    };
  });
  headerRow.height = 30;

  // Group Sessions & Records by Zone
  const zoneMap = {};
  societySessions.forEach(s => {
    const zName = s.zone_name || 'Unassigned Zone';
    if (!zoneMap[zName]) {
      zoneMap[zName] = { name: zName, sessionIds: [] };
    }
    zoneMap[zName].sessionIds.push(s.id);
  });

  const sortedZoneNames = Object.keys(zoneMap).sort();

  let totalMembersSum = 0;
  let totalKilosSum = 0;
  let totalBagsSum = 0;
  let totalBonusSum = 0;

  sortedZoneNames.forEach((zName, idx) => {
    const sessionIds = zoneMap[zName].sessionIds;
    const zoneRecs = allRecords.filter(r => sessionIds.includes(r.session));
    
    // Member count (unique farmers)
    const memberSet = new Set(zoneRecs.map(r => r.kk_id || r.farmer_name || r.id));
    const membersCount = memberSet.size;

    // Totals
    const kilos = zoneRecs.reduce((sum, r) => sum + (parseFloat(r.kilos) || 0), 0);
    const bags = Math.round(kilos / 62.5);
    const bonus = kilos * bonusRate;

    totalMembersSum += membersCount;
    totalKilosSum += kilos;
    totalBagsSum += bags;
    totalBonusSum += bonus;

    const row = summarySheet.addRow([
      idx + 1,
      zName,
      membersCount,
      kilos,
      bags,
      bonus,
      ''
    ]);
    row.height = 32;

    const numCell = row.getCell(1);
    numCell.font = { name: 'Times New Roman', size: 12, bold: true };
    numCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const zoneCell = row.getCell(2);
    zoneCell.font = { name: 'Times New Roman', size: 12, bold: true };
    zoneCell.alignment = { vertical: 'middle', horizontal: 'left' };

    const memCell = row.getCell(3);
    memCell.font = { name: 'Times New Roman', size: 12, bold: true };
    memCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const kilosCell = row.getCell(4);
    kilosCell.font = { name: 'Times New Roman', size: 12, bold: true };
    kilosCell.numFmt = '#,##0.00';
    kilosCell.alignment = { vertical: 'middle', horizontal: 'right' };

    const bagsCell = row.getCell(5);
    bagsCell.font = { name: 'Times New Roman', size: 12, bold: true };
    bagsCell.numFmt = '#,##0';
    bagsCell.alignment = { vertical: 'middle', horizontal: 'right' };

    const bonusCell = row.getCell(6);
    bonusCell.font = { name: 'Times New Roman', size: 12, bold: true };
    bonusCell.numFmt = '#,##0.00';
    bonusCell.alignment = { vertical: 'middle', horizontal: 'right' };

    for (let c = 1; c <= 7; c++) {
      row.getCell(c).border = {
        bottom: { style: 'thin', color: { argb: 'FF000000' } }
      };
    }
  });

  // Total Summary Row
  if (sortedZoneNames.length > 0) {
    const totalRow = summarySheet.addRow([
      '',
      'TOTAL',
      totalMembersSum,
      totalKilosSum,
      totalBagsSum,
      totalBonusSum,
      ''
    ]);
    totalRow.height = 36;
    for (let c = 1; c <= 7; c++) {
      const cell = totalRow.getCell(c);
      cell.font = { name: 'Times New Roman', size: 12, bold: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'double', color: { argb: 'FF000000' } }
      };
      if (c === 3) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (c === 4 || c === 5 || c === 6) cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
    totalRow.getCell(4).numFmt = '#,##0.00';
    totalRow.getCell(5).numFmt = '#,##0';
    totalRow.getCell(6).numFmt = '#,##0.00';
  }

  // ==========================================
  // TAB 2: ZONE (Detailed Farmers Breakdown)
  // ==========================================
  const zoneSheet = workbook.addWorksheet('Zone');
  zoneSheet.columns = [
    { key: 'index', width: 6 },
    { key: 'member', width: 35 },
    { key: 'farmer_id', width: 20 },
    { key: 'zone', width: 22 },
    { key: 'volume', width: 16 },
    { key: 'bonus', width: 16 },
    { key: 'sign', width: 25 },
  ];

  zoneSheet.mergeCells('A1:G1');
  const zTitle = zoneSheet.getCell('A1');
  zTitle.value = `KUAPA KOKOO ${societyName.toUpperCase()} SOCIETY - ZONE FARMERS BONUS BREAKDOWN`;
  zTitle.font = { name: 'Times New Roman', size: 13, bold: true };
  zTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  zoneSheet.getRow(1).height = 35;

  const zHeaders = ['#', 'MEMBER NAME', 'FARMER ID', 'ZONE', 'VOLUME (kg)', 'BONUS (₵)', 'SIGNATURE'];
  const zHeaderRow = zoneSheet.getRow(3);
  zHeaders.forEach((h, index) => {
    const cell = zHeaderRow.getCell(index + 1);
    cell.value = h;
    cell.font = { name: 'Times New Roman', size: 11, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  zHeaderRow.height = 28;

  // Group individual farmer data across society
  const farmerMap = {};
  const socSessionIds = societySessions.map(s => s.id);
  allRecords.filter(r => socSessionIds.includes(r.session)).forEach(r => {
    const sess = societySessions.find(s => s.id === r.session);
    const name = (r.farmer_name || 'Unknown').toUpperCase();
    const id = r.kk_id || r.cocoa_card_id || 'N/A';
    const zoneName = sess?.zone_name || 'N/A';
    const kilos = parseFloat(r.kilos) || 0;

    const key = `${id}_${name}`;
    if (!farmerMap[key]) {
      farmerMap[key] = { name, id, zoneName, kilos: 0 };
    }
    farmerMap[key].kilos += kilos;
  });

  const sortedFarmers = Object.values(farmerMap).sort((a, b) => a.name.localeCompare(b.name));

  sortedFarmers.forEach((farmer, index) => {
    const row = zoneSheet.addRow([
      index + 1,
      farmer.name,
      farmer.id,
      farmer.zoneName,
      farmer.kilos,
      farmer.kilos * bonusRate,
      ''
    ]);
    row.height = 30;
    
    for (let i = 1; i <= 7; i++) {
      const cell = row.getCell(i);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
      if (i === 1 || i === 3 || i === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (i === 5 || i === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    }
    row.getCell(5).numFmt = '#,##0.00';
    row.getCell(6).numFmt = '#,##0.00';
  });

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${societyName}_Society_Bonus_Summary.xlsx`);
};

/**
 * Export Individual Zone Bonus Report
 */
export const exportBonusReport = async (zoneName, societyName, records, bonusRate) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Zone');

  sheet.columns = [
    { key: 'index', width: 6 },
    { key: 'member', width: 35 },
    { key: 'farmer_id', width: 20 },
    { key: 'volume', width: 16 },
    { key: 'bonus', width: 16 },
    { key: 'sign', width: 25 },
  ];

  sheet.mergeCells('B1:F1');
  const titleCell = sheet.getCell('B1');
  titleCell.value = 'KUAPA KOKOO FARMERS UNION, 2025/26 CASH BONUS DISTRIBUTION';
  titleCell.font = { name: 'Times New Roman', size: 14, bold: true };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 40;

  sheet.mergeCells('B2:E2');
  const subtitleCell = sheet.getCell('B2');
  subtitleCell.value = `${zoneName.toUpperCase()} Zone under ${societyName.toUpperCase()}`;
  subtitleCell.font = { name: 'Times New Roman', size: 12, bold: true };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  
  const floidCell = sheet.getCell('F2');
  floidCell.value = 'KUAPA KOKOO\nFAIRTRADE CERTIFIED\nFLOID NO. 1475';
  floidCell.font = { name: 'Times New Roman', size: 8 };
  floidCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  sheet.getRow(2).height = 45;

  sheet.getRow(3).height = 20;

  const headers = ['#', 'MEMBER', 'FARMER ID', 'VOLUME(kilos)', 'BONUS(GHC)', 'SIGN./THUMBPRINT'];
  const headerRow = sheet.getRow(4);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { name: 'Times New Roman', size: 11, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  headerRow.height = 30;

  const farmerMap = {};
  records.forEach(r => {
    const name = (r.farmer_name || 'Unknown').toUpperCase();
    const id = r.kk_id || r.cocoa_card_id || 'N/A';
    const kilos = parseFloat(r.kilos) || 0;
    
    if (!farmerMap[id]) {
      farmerMap[id] = { name, id, kilos: 0 };
    }
    farmerMap[id].kilos += kilos;
  });

  const aggregatedFarmers = Object.values(farmerMap).sort((a, b) => a.name.localeCompare(b.name));

  aggregatedFarmers.forEach((farmer, index) => {
    const row = sheet.addRow([
      index + 1,
      farmer.name,
      farmer.id,
      farmer.kilos,
      farmer.kilos * bonusRate,
      ''
    ]);
    row.height = 35;
    
    for (let i = 1; i <= 6; i++) {
      const cell = row.getCell(i);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF888888' } },
        bottom: { style: 'thin', color: { argb: 'FF888888' } },
        left: { style: 'thin', color: { argb: 'FF888888' } },
        right: { style: 'thin', color: { argb: 'FF888888' } }
      };
      if (i === 1 || i === 4 || i === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    }
    row.getCell(4).numFmt = '#,##0.00';
    row.getCell(5).numFmt = '#,##0.00';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${zoneName}_Zone_Bonus_Report.xlsx`);
};
