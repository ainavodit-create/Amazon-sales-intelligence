import { useState } from 'react';
import { Upload, ChartBar as BarChart3, ArrowLeftRight, Package, PackageX, TrendingDown, Lock, Clock as Unlock } from 'lucide-react';
import { useDemoMode } from '../contexts/DemoModeContext';
import { EncryptModal } from './EncryptModal';

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
}

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const { isDemoMode, setIsDemoMode } = useDemoMode();
  const [showModal, setShowModal] = useState(false);

  const handleEncryptClick = () => {
    if (!isDemoMode) {
      setIsDemoMode(true);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col p-6 fixed left-0 top-0 h-screen">
        <div className="mb-8">
          <div className="flex flex-col gap-1">
            {isDemoMode ? (
              <img
                src="/Vgromore_Logo.jpg"
                alt="V Growmore Consultants Logo"
                className="w-40 h-auto object-contain"
              />
            ) : (
              <img
                src="/caramelly-new-logo-2024_200x@2x.avif"
                alt="Caramelly Logo"
                className="w-32 h-auto"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">Amazon Sales Intelligence</p>
          </div>

          <button
            onClick={handleEncryptClick}
            title={isDemoMode ? 'Click to unlock real data' : 'Click to re-enable Demo Mode'}
            className={`mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
              isDemoMode
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {isDemoMode
              ? <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              : <Unlock className="w-3.5 h-3.5 flex-shrink-0" />
            }
            <span>{isDemoMode ? 'Demo Mode' : 'Live Mode'}</span>
            <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              isDemoMode ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'
            }`}>
              {isDemoMode ? 'Encrypt' : 'On'}
            </span>
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          <div className="space-y-1">
            <button
              onClick={() => onNavChange('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeNav === 'dashboard'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => onNavChange('compare')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeNav === 'compare'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <ArrowLeftRight className="w-5 h-5" />
              <span className="font-medium">Compare</span>
            </button>

            <button
              onClick={() => onNavChange('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeNav === 'inventory'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Inventory</span>
            </button>

            <button
              onClick={() => onNavChange('returns-analysis')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeNav === 'returns-analysis'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <TrendingDown className="w-5 h-5" />
              <span className="font-medium">Returns Analysis</span>
            </button>
          </div>

          <div className="pt-8">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 mb-3">
              Data Management
            </div>
            <button
              onClick={() => onNavChange('mapping')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeNav === 'mapping'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Master Mapping</span>
            </button>

            <button
              onClick={() => onNavChange('sales')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeNav === 'sales'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Sales Upload</span>
            </button>

            <button
              onClick={() => onNavChange('returns')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeNav === 'returns'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <PackageX className="w-5 h-5" />
              <span className="font-medium">Returns Upload</span>
            </button>
          </div>
        </nav>
      </div>

      <EncryptModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
