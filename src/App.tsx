import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MasterMappingUpload } from './components/MasterMappingUpload';
import { MonthlySalesUpload } from './components/MonthlySalesUpload';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { ComparativeDashboard } from './components/ComparativeDashboard';
import { InventoryReport } from './components/InventoryReport';
import { ReturnsUpload } from './components/ReturnsUpload';
import { ReturnsAnalysis } from './components/ReturnsAnalysis';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  const [activeNav, setActiveNav] = useState('dashboard');

  const handleDataUploaded = () => {
    setActiveNav('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
      <div className="ml-64">
        {activeNav === 'mapping' && <MasterMappingUpload />}
        {activeNav === 'sales' && <MonthlySalesUpload onDataUploaded={handleDataUploaded} />}
        {activeNav === 'returns' && <ReturnsUpload onDataUploaded={() => setActiveNav('returns-analysis')} />}
        {activeNav === 'dashboard' && <MonthlyDashboard />}
        {activeNav === 'compare' && <ComparativeDashboard />}
        {activeNav === 'inventory' && <InventoryReport />}
        {activeNav === 'returns-analysis' && <ReturnsAnalysis />}
      </div>
      <Toaster />
    </div>
  );
}

export default App;
