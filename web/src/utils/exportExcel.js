import * as XLSX from 'xlsx';

/**
 * Exports all purchase sessions and their records as a CSV/Excel file.
 * @param {Array} sessions - Array of PurchaseSession objects from the API
 */
export function exportSessionsToExcel(sessions) {
  if (!sessions || sessions.length === 0) return;

  // Flatten sessions + records into rows matching the physical book format
  const rows = [];
  sessions.forEach(session => {
    const sessionRecords = session.records || [];
    if (sessionRecords.length === 0) {
      rows.push({
        'Cocoa Season':       session.cocoa_season    || '',
        'Zone Name':          session.zone_name        || '',
        'Society/District':   session.society_district_name || '',
        'Waybill No.':        session.waybill_no       || '',
        'DPRS Number':        session.dprs_number      || '',
        'GPS Latitude':       session.latitude         || '',
        'GPS Longitude':      session.longitude        || '',
        'Date':               '',
        'Farmer Name':        '',
        'Farmer Status':      '',
        'Cocoa Card ID':      '',
        'KK ID':              '',
        'Kilos':              '',
        'Amount (GHC)':       '',
      });
    } else {
      sessionRecords.forEach(record => {
        rows.push({
          'Cocoa Season':     session.cocoa_season    || '',
          'Zone Name':        session.zone_name        || '',
          'Society/District': session.society_district_name || '',
          'Waybill No.':      session.waybill_no       || '',
          'DPRS Number':      session.dprs_number      || '',
          'GPS Latitude':     session.latitude         || '',
          'GPS Longitude':    session.longitude        || '',
          'Date':             record.date              || '',
          'Farmer Name':      record.farmer_name       || '',
          'Farmer Status':    record.farmer_status     || '',
          'Cocoa Card ID':    record.cocoa_card_id     || '',
          'KK ID':            record.kk_id             || '',
          'Kilos':            record.kilos             || 0,
          'Amount (GHC)':     record.amount_ghc        || 0,
        });
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, 14)
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Records');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `kuapa_kokoo_purchases_${today}.xlsx`);
}
