import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export Farmer Lifetime Purchase & Bonus Statement as PDF
 */
export const exportFarmerStatementPdf = (farmer, summary, records = [], seasonsBreakdown = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Title
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('KUAPA KOKOO FARMERS COOPERATIVE UNION LIMITED', pageWidth / 2, 16, { align: 'center' });

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(11);
  doc.text('OFFICIAL FARMER LIFETIME PURCHASE STATEMENT & BONUS SUMMARY', pageWidth / 2, 22, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(14, 26, pageWidth - 14, 26);

  // Farmer Details Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FARMER PROFILE INFORMATION', 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const leftX = 14;
  const rightX = 110;
  let currentY = 40;

  doc.setFont('helvetica', 'bold');
  doc.text('Farmer Name:', leftX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(farmer.name || '—'), leftX + 32, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('KK-ID Number:', rightX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(farmer.kk_id_num || '—'), rightX + 34, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Society Depot:', leftX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(farmer.society || '—'), leftX + 32, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Zone / District:', rightX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(farmer.zone || '—'), rightX + 34, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Station Mark:', leftX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(farmer.station_mark || '—'), leftX + 32, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Ghana Card / ID:', rightX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(farmer.id_card_number || 'N/A'), rightX + 34, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Phone Number:', leftX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(farmer.phone_numbers || 'N/A'), leftX + 32, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Farm Field Size:', rightX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(farmer.field_size ? `${farmer.field_size} Hectares` : 'N/A', rightX + 34, currentY);

  // Summary Metrics Table Box
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LIFETIME ACCUMULATED SUMMARY', 14, currentY);

  currentY += 4;

  const totalKilos = summary?.total_kilos || (farmer.volume || 0);
  const totalBags = summary?.total_bags || (farmer.bags || Math.round(totalKilos / 62.5));
  const totalAmount = summary?.total_amount_ghc || (totalKilos * 50);
  const bonusEntitled = summary?.bonus_entitled || (totalKilos * 1.12);
  const yieldEfficiency = summary?.yield_per_hectare || 0;

  autoTable(doc, {
    startY: currentY,
    head: [['Lifetime Kilos (kg)', 'Lifetime Bags (62.5kg)', 'Total Paid Out (GH₵)', 'Bonus Entitled (GH₵)', 'Yield (kg / Ha)']],
    body: [[
      `${totalKilos.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`,
      `${totalBags} bags`,
      `GH₵ ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `GH₵ ${bonusEntitled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      yieldEfficiency > 0 ? `${yieldEfficiency} kg/Ha` : '—'
    ]],
    theme: 'grid',
    headStyles: { fillColor: [45, 106, 79], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontStyle: 'bold', fontSize: 10, textColor: [30, 41, 59] },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'center' }
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Seasons Breakdown Table if available
  if (seasonsBreakdown.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CROP SEASON PERFORMANCE BREAKDOWN', 14, currentY);
    currentY += 4;

    const seasonRows = seasonsBreakdown.map(sb => [
      sb.season,
      `${sb.count} Waybill(s)`,
      `${(sb.kilos || 0).toLocaleString()} kg`,
      `${sb.bags} bags`,
      `GH₵ ${(sb.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `GH₵ ${(sb.bonus || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Crop Season', 'Deliveries', 'Volume (kg)', 'Bags', 'Amount (GH₵)', 'Bonus (GH₵)']],
      body: seasonRows,
      theme: 'striped',
      headStyles: { fillColor: [60, 64, 67], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // Detailed Purchase Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ITEMIZED DELIVERIES & WAYBILL LEDGER', 14, currentY);
  currentY += 4;

  const ledgerRows = records.length > 0 ? records.map((r, i) => [
    i + 1,
    r.date || '—',
    r.season || '2025/2026',
    r.waybill_no || `WB-${i+1}`,
    `${parseFloat(r.kilos || 0).toFixed(1)} kg`,
    Math.round(parseFloat(r.kilos || 0) / 62.5),
    `GH₵ ${(parseFloat(r.kilos || 0) * 1.12).toFixed(2)}`
  ]) : [[ '—', 'Master Import', 'All Seasons', 'Legacy Log', `${totalKilos} kg`, totalBags, `GH₵ ${bonusEntitled.toFixed(2)}` ]];

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Season', 'Waybill No.', 'Volume (kg)', 'Bags', 'Bonus Entitled']],
    body: ledgerRows,
    theme: 'grid',
    headStyles: { fillColor: [24, 76, 50], textColor: [255, 255, 255], fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // Footer & Signatures
  const finalY = doc.lastAutoTable.finalY + 15;
  const pageHeight = doc.internal.pageSize.getHeight();

  if (finalY + 30 < pageHeight) {
    doc.setFont('times', 'normal');
    doc.setFontSize(10);

    doc.line(14, finalY, 70, finalY);
    doc.text('Society Officer Signature', 14, finalY + 5);

    doc.line(135, finalY, 195, finalY);
    doc.text('Farmer / Thumbprint Signature', 135, finalY + 5);
  }

  // Save PDF
  const filename = `Farmer_Statement_${(farmer.name || 'Farmer').replace(/[^a-zA-Z0-9]/g, '_')}_${farmer.kk_id_num || 'ID'}.pdf`;
  doc.save(filename);
};
