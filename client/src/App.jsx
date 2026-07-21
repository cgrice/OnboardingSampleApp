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

  const loadOnboarding = () => {
    return fetch('/api/onboarding')
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
  };

  useEffect(() => {
    loadOnboarding();
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
          <DashboardTab data={onboardingData} loading={loading} error={error} onCustomerCreated={loadOnboarding} />
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
        {activeTab === 'import' && (
          <PlaceholderTab title="Import" description="Import customer data into the platform" />
        )}
      </main>
    </div>
  );
}

function DashboardTab({ data, loading, error, onCustomerCreated }) {
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Onboarding Queue</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Customer</button>
        )}
      </div>

      {showForm && (
        <NewCustomerForm
          onCancel={() => setShowForm(false)}
          onCreated={async () => {
            await onCustomerCreated();
            setShowForm(false);
          }}
        />
      )}

      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        {data.length} customer(s) awaiting onboarding
      </p>

      {data.length === 0 && !showForm && (
        <div className="placeholder"><p>No customers in the onboarding queue</p></div>
      )}

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

function NewCustomerForm({ onCancel, onCreated }) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim() === '') {
      setFormError('Name is required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry, region, contactEmail })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      await onCreated();
    } catch (err) {
      console.error('Failed to create customer:', err);
      setFormError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form className="customer-card" onSubmit={handleSubmit}>
      <h3>New Customer</h3>
      <div className="new-customer-fields">
        <input
          aria-label="Name"
          placeholder="Name (required)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <input
          aria-label="Industry"
          placeholder="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />
        <input
          aria-label="Region"
          placeholder="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <input
          aria-label="Contact Email"
          placeholder="Contact Email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>

      {formError && (
        <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{formError}</p>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
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
