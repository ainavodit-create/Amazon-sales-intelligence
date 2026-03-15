import { Upload, BarChart3, ArrowLeftRight, Package, PackageX, TrendingDown } from 'lucide-react';

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
}

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col p-6 fixed left-0 top-0 h-screen">
      <div className="mb-12">
        <div className="flex flex-col gap-1">
          <img
            src="/caramelly-new-logo-2024_200x@2x.avif"
            alt="Caramelly Logo"
            className="w-32 h-auto"
          />
          <p className="text-xs text-gray-500 mt-1">Amazon Sales Intelligence</p>
        </div>
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
  );
}
