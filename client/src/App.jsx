import React, { useState, useEffect } from 'react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'customer-info', label: 'Customer Info' },
  { id: 'data-mapping', label: 'Data Mapping' },
  { id: 'tenant-setup', label: 'Tenant Setup' },
  { id: 'import', label: 'Import' }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [onboardingData, setOnboardingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/onboarding')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid response format');
        return data;
      })
      .then(data => {
        setOnboardingData(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch onboarding data:', err);
        setError(err.message);
        setOnboardingData([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Onboarding Dashboard</h1>
        <p>Customer Success Team - Internal Tool</p>
      </header>

      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'dashboard' && (
          <DashboardTab data={onboardingData} loading={loading} error={error} />
        )}
        {activeTab === 'customer-info' && (
          <PlaceholderTab title="Customer Info" description="Collect and validate customer information" />
        )}
        {activeTab === 'data-mapping' && (
          <PlaceholderTab title="Data Mapping" description="Map customer data to platform configuration" />
        )}
        {activeTab === 'tenant-setup' && (
          <PlaceholderTab title="Tenant Setup" description="Provision and configure customer tenant" />
        )}
        {activeTab === 'import' && <ImportTab />}
      </main>
    </div>
  );
}

function DashboardTab({ data, loading, error }) {
  if (loading) {
    return <div className="placeholder"><p>Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="placeholder">
        <p style={{ color: '#dc2626' }}>⚠️ Failed to load onboarding data</p>
        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="placeholder"><p>No customers in the onboarding queue</p></div>;
  }

  return (
    <div>
      <h2>Onboarding Queue</h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        {data.length} customer(s) awaiting onboarding
      </p>

      {data.map(item => (
        <div key={item.customerId} className="customer-card">
          <h3>{item.customerName}</h3>
          <div className="customer-meta">
            <span>📍 {item.customerRegion}</span>
            <span>🏭 {item.customerIndustry}</span>
          </div>

          <div className="progress-section">
            <ProgressBar percent={item.progressPercent} />
            <Checklist steps={item.steps} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar" 
        style={{ width: `${Math.max(percent, 0)}%` }}
      >
        {percent > 0 ? `${percent}%` : ''}
      </div>
    </div>
  );
}

function Checklist({ steps }) {
  return (
    <ul className="checklist">
      {steps.map(step => (
        <li key={step.id}>
          <span className={`step-status ${step.status}`}>
            {step.status === 'completed' ? '✓' : step.order}
          </span>
          <span>{step.name}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#9ca3af' }}>
            {step.status.replace('_', ' ')}
          </span>
        </li>
      ))}
    </ul>
  );
}

const CLIENT_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'entityType', label: 'Entity Type' },
  { key: 'status', label: 'Status' },
  { key: 'onboardedDate', label: 'Onboarded' },
  { key: 'taxId', label: 'Tax ID' },
  { key: 'annualRevenue', label: 'Annual Revenue' },
  { key: 'industry', label: 'Industry' },
  { key: 'paymentTerms', label: 'Payment Terms' },
  { key: 'primaryContact', label: 'Primary Contact' }
];

function ImportTab() {
  const [adapters, setAdapters] = useState([]);
  const [customer, setCustomer] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch('/api/import/adapters')
      .then((res) => res.json())
      .then((list) => {
        setAdapters(list);
        if (list.length > 0) setCustomer(list[0].key);
      })
      .catch((err) => setError(`Could not load customers: ${err.message}`));
  }, []);

  const handleImport = async () => {
    if (!file || !customer) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch(`/api/import/clients?customer=${encodeURIComponent(customer)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h2>Import Clients</h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Upload a client CSV export and map it to the shared data model.
      </p>

      <div className="import-controls" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <label>
          Customer:{' '}
          <select value={customer} onChange={(e) => setCustomer(e.target.value)}>
            {adapters.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
        </label>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />

        <button className="import-btn" onClick={handleImport} disabled={!file || !customer || importing}>
          {importing ? 'Importing…' : 'Import & Map'}
        </button>
      </div>

      {error && (
        <div className="placeholder">
          <p style={{ color: '#dc2626' }}>⚠️ {error}</p>
        </div>
      )}

      {result && <ImportResult result={result} />}
    </div>
  );
}

function ImportResult({ result }) {
  const { summary, records, customer } = result;
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <strong>{summary.mapped}</strong> record(s) mapped from <em>{customer}</em>.{' '}
        {summary.unmappedColumns.length > 0 && (
          <span style={{ color: '#d97706' }}>
            Ignored columns: {summary.unmappedColumns.join(', ')}.{' '}
          </span>
        )}
        {summary.unmappedValues > 0 && (
          <span style={{ color: '#d97706' }}>
            {summary.unmappedValues} value(s) not recognized (passed through).{' '}
          </span>
        )}
        {summary.unparseableValues > 0 && (
          <span style={{ color: '#d97706' }}>
            {summary.unparseableValues} date/number(s) left as text.
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="import-table" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {CLIENT_COLUMNS.map((col) => (
                <th key={col.key} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((row, i) => (
              <tr key={row.id || i}>
                {CLIENT_COLUMNS.map((col) => (
                  <td key={col.key} style={{ padding: '6px 10px', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' }}>
                    {String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlaceholderTab({ title, description }) {
  return (
    <div className="placeholder">
      <h2>{title}</h2>
      <p>{description}</p>
      <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
        🚧 This section is ready to be built
      </p>
    </div>
  );
}

export default App;
