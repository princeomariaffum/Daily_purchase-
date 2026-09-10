import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export Society Bonus Summary as PDF
 */
export const exportSocietyBonusPdf = (societyName, societySessions, allRecords, bonusRate = 1.12) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Page Width
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Title
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('KUAPA KOKOO COOPERATIVE COCOA FARMERS AND MARKETING UNION LIMITED', pageWidth / 2, 16, { align: 'center' });

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(12);
  doc.text('BONUS PAYMENT', pageWidth / 2, 23, { align: 'center' });
  doc.text('2025/26 SEASON', pageWidth / 2, 29, { align: 'center' });

  // Society Name
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text(societyName.toUpperCase(), 14, 38);

  // Prepare Data
  const zoneMap = {};
  societySessions.forEach(s => {
    const zName = s.zone_name || 'Unassigned Zone';
    if (!zoneMap[zName]) {
      zoneMap[zName] = { name: zName, sessionIds: [] };
    }
    zoneMap[zName].sessionIds.push(s.id);
  });

  const sortedZoneNames = Object.keys(zoneMap).sort();

  let totalMembers = 0;
  let totalKilos = 0;
  let totalBags = 0;
  let totalBonus = 0;

  const tableRows = sortedZoneNames.map((zName, idx) => {
    const sessionIds = zoneMap[zName].sessionIds;
    const zoneRecs = allRecords.filter(r => sessionIds.includes(r.session));
    
    const memberSet = new Set(zoneRecs.map(r => r.kk_id || r.farmer_name || r.id));
    const membersCount = memberSet.size;
    const kilos = zoneRecs.reduce((sum, r) => sum + (parseFloat(r.kilos) || 0), 0);
    const bags = Math.round(kilos / 62.5);
    const bonus = kilos * bonusRate;

    totalMembers += membersCount;
    totalKilos += kilos;
    totalBags += bags;
    totalBonus += bonus;

    return [
      idx + 1,
      zName,
      membersCount,
      kilos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      bags.toLocaleString(),
      bonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ''
    ];
  });

  // Append Total Row
  if (sortedZoneNames.length > 0) {
    tableRows.push([
      '',
      'TOTAL',
      totalMembers,
      totalKilos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalBags.toLocaleString(),
      totalBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ''
    ]);
  }

  // Generate Table
  autoTable(doc, {
    startY: 43,
    head: [['#', 'Zone', 'Members', 'Sum(Kilos)', 'Sum(Bags)', 'Sum Bonus (GH₵)', 'Signature']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 11,
      textColor: [0, 0, 0],
      fillColor: false,
      lineWidth: { bottom: 0.5 },
      lineColor: [0, 0, 0],
      halign: 'left'
    },
    bodyStyles: {
      font: 'times',
      fontSize: 10.5,
      textColor: [0, 0, 0],
      lineWidth: { bottom: 0.1 },
      lineColor: [180, 180, 180],
      cellPadding: 3.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 50 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
      6: { cellWidth: 25 }
    },
    didParseCell: (data) => {
      // Style the TOTAL row at the bottom
      if (data.row.index === tableRows.length - 1 && sortedZoneNames.length > 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.lineWidth = { top: 0.5, bottom: 0.8 };
        data.cell.styles.lineColor = [0, 0, 0];
      }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Kuapa Kokoo Bonus Summary Report - Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`${societyName}_Society_Bonus_Summary.pdf`);
};

/**
 * Export Zone Bonus Details as PDF
 */
export const exportZoneBonusPdf = (zoneName, societyName, records, bonusRate = 1.12) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Title
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('KUAPA KOKOO FARMERS UNION', pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(12);
  doc.text('2025/26 CASH BONUS DISTRIBUTION', pageWidth / 2, 20, { align: 'center' });

  // Subtitle
  doc.setFontSize(11);
  doc.text(`${zoneName.toUpperCase()} ZONE (${societyName.toUpperCase()} SOCIETY)`, 14, 28);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('FAIRTRADE CERTIFIED (FLOID NO. 1475)', pageWidth - 14, 28, { align: 'right' });

  // Aggregate Farmer Records
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

  let totalKilos = 0;
  let totalBonus = 0;

  const tableRows = aggregatedFarmers.map((farmer, idx) => {
    const bonus = farmer.kilos * bonusRate;
    totalKilos += farmer.kilos;
    totalBonus += bonus;

    return [
      idx + 1,
      farmer.name,
      farmer.id,
      farmer.kilos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      bonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ''
    ];
  });

  // Add Total Row
  if (aggregatedFarmers.length > 0) {
    tableRows.push([
      '',
      'TOTAL',
      '',
      totalKilos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ''
    ]);
  }

  autoTable(doc, {
    startY: 33,
    head: [['#', 'Member Name', 'Farmer ID', 'Volume (kg)', 'Bonus (GH₵)', 'Signature / Thumbprint']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      fontSize: 10,
      textColor: [0, 0, 0],
      fillColor: [240, 240, 240],
      lineWidth: 0.2,
      lineColor: [100, 100, 100],
      halign: 'center'
    },
    bodyStyles: {
      font: 'times',
      fontSize: 9.5,
      textColor: [0, 0, 0],
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 55 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },
      5: { cellWidth: 35 }
    },
    didParseCell: (data) => {
      if (data.row.index === tableRows.length - 1 && aggregatedFarmers.length > 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 245, 245];
      }
    }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Kuapa Kokoo Zone Bonus Report - Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  doc.save(`${zoneName}_Zone_Bonus_Report.pdf`);
};
