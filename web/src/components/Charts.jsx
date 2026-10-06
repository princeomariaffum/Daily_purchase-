import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useSeason } from '../contexts/SeasonContext';

// ---- Kilos Trend (Area Chart) ----
export function KilosTrendChart({ sessions }) {
  const { currentTheme } = useSeason();
  const strokeColor = currentTheme?.chartLine || '#059669';
  const gradColor = currentTheme?.chartGradientStart || '#34d399';
  const tooltipBg = currentTheme?.primaryDark || '#064e3b';
  const tooltipAccent = currentTheme?.activeNavText || '#34d399';

  const data = sessions
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(s => ({
      name: new Date(s.created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' }),
      kilos: parseFloat((s.total_kilos || 0).toFixed(2)),
      amount: parseFloat((s.total_amount || 0).toFixed(2)),
    }));

  if (data.length === 0) return <EmptyChart label="Kilos trend will appear here once sessions are synced." />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="kilosGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={gradColor} stopOpacity={0.35}/>
            <stop offset="95%" stopColor={gradColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={45}/>
        <Tooltip
          contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
          labelStyle={{ color: tooltipAccent, fontWeight: 700 }}
          formatter={(v) => [`${v} kg`, 'Kilos']}
        />
        <Area type="monotone" dataKey="kilos" stroke={strokeColor} strokeWidth={2.5} fill="url(#kilosGrad)" dot={{ fill: strokeColor, r: 4 }}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---- Amount per Session (Bar Chart) ----
export function AmountBarChart({ sessions }) {
  const { currentTheme } = useSeason();
  const bar1 = currentTheme?.chartBar1 || '#064e3b';
  const bar2 = currentTheme?.chartBar2 || '#059669';
  const tooltipBg = currentTheme?.primaryDark || '#064e3b';
  const tooltipAccent = currentTheme?.activeNavText || '#34d399';

  const data = sessions
    .slice(-8)
    .map(s => ({
      name: s.waybill_no,
      amount: parseFloat((s.total_amount || 0).toFixed(2)),
    }));

  if (data.length === 0) return <EmptyChart label="GHC amounts per waybill will appear here." />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={55}
          tickFormatter={v => `₵${v.toLocaleString()}`}
        />
        <Tooltip
          contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
          labelStyle={{ color: tooltipAccent, fontWeight: 700 }}
          formatter={(v) => [`₵${v.toLocaleString()}`, 'Amount']}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? bar1 : bar2}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---- Farmer Status (Pie Chart) ----
export function FarmerStatusPie({ records }) {
  const { currentTheme } = useSeason();
  const pieColors = currentTheme?.pieColors || ['#059669', '#34d399', '#10b981', '#0d9488'];
  const tooltipBg = currentTheme?.primaryDark || '#064e3b';

  const existing = records.filter(r => r.farmer_status === 'Existing').length;
  const newF     = records.filter(r => r.farmer_status === 'New').length;
  const data = [
    { name: 'Existing', value: existing },
    { name: 'New',      value: newF },
  ].filter(d => d.value > 0);

  if (data.length === 0) return <EmptyChart label="Farmer status breakdown will appear here." />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
          paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]}/>)}
        </Pie>
        <Tooltip
          contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
          formatter={(v, n) => [v, n]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#6b7280' }}/>
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---- Society Comparison Bar Chart ----
export function SocietyComparisonBarChart({ sessions, primaryColor = '#059669' }) {
  const societyMap = {};
  sessions.forEach(s => {
    const soc = s.society_district_name || 'Unassigned';
    if (!societyMap[soc]) {
      societyMap[soc] = { name: soc, kilos: 0, bags: 0, amount: 0, waybills: 0 };
    }
    societyMap[soc].kilos += parseFloat(s.total_kilos) || 0;
    societyMap[soc].bags += parseFloat(s.total_bags) || 0;
    societyMap[soc].amount += parseFloat(s.total_amount) || 0;
    societyMap[soc].waybills += 1;
  });

  const data = Object.values(societyMap)
    .sort((a, b) => b.kilos - a.kilos)
    .map(s => ({
      ...s,
      kilos: parseFloat(s.kilos.toFixed(2)),
      amount: parseFloat(s.amount.toFixed(2)),
    }));

  if (data.length === 0) return <EmptyChart label="Society comparative analytics will appear here once waybills are logged." />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 12, right: 10, left: 0, bottom: 20 }} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
          axisLine={false} 
          tickLine={false} 
          interval={0}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: '#64748b' }} 
          axisLine={false} 
          tickLine={false} 
          width={50}
          tickFormatter={v => `${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
          labelStyle={{ color: '#38bdf8', fontWeight: 700, marginBottom: 4 }}
          formatter={(v, name) => [
            name === 'kilos' ? `${v.toLocaleString()} kg` : `₵${v.toLocaleString()}`, 
            name === 'kilos' ? 'Total Volume' : 'Total Amount'
          ]}
        />
        <Bar dataKey="kilos" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? primaryColor : (i === 1 ? '#2563eb' : (i === 2 ? '#d97706' : '#64748b'))} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---- Zone Breakdown Bar Chart for a Selected Society ----
export function ZoneBreakdownBarChart({ sessions, selectedSociety, color = '#2563eb' }) {
  const targetSessions = selectedSociety 
    ? sessions.filter(s => s.society_district_name === selectedSociety)
    : sessions;

  const zoneMap = {};
  targetSessions.forEach(s => {
    const zone = s.zone_name || 'Unassigned Zone';
    if (!zoneMap[zone]) {
      zoneMap[zone] = { name: zone, kilos: 0, bags: 0 };
    }
    zoneMap[zone].kilos += parseFloat(s.total_kilos) || 0;
    zoneMap[zone].bags += parseFloat(s.total_bags) || 0;
  });

  const data = Object.values(zoneMap)
    .sort((a, b) => b.kilos - a.kilos)
    .map(z => ({
      ...z,
      kilos: parseFloat(z.kilos.toFixed(2)),
    }));

  if (data.length === 0) return <EmptyChart label={`No zone breakdown data for ${selectedSociety || 'selected society'}.`} />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 12, right: 10, left: 0, bottom: 20 }} barSize={26}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
          axisLine={false} 
          tickLine={false} 
        />
        <YAxis 
          tick={{ fontSize: 11, fill: '#64748b' }} 
          axisLine={false} 
          tickLine={false} 
          width={45}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13 }}
          labelStyle={{ color: '#60a5fa', fontWeight: 700 }}
          formatter={(v) => [`${v.toLocaleString()} kg`, 'Zone Volume']}
        />
        <Bar dataKey="kilos" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ label }) {
  return (
    <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d1d5db' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/></svg>
      <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 12, textAlign: 'center', maxWidth: 200 }}>{label}</p>
    </div>
  );
}
