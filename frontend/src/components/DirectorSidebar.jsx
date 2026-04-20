import React from 'react';
import { LayoutDashboard, FolderOpen, UploadCloud, LogOut } from 'lucide-react';

const DirectorSidebar = ({ activeTab, setActiveTab, onLogoutClick }) => {
  // Las opciones de tu menú actual
  const menuItems = [
    { id: 'general', label: 'CONSOLIDADO', icon: <LayoutDashboard size={18} /> },
    { id: 'ingresos', label: 'INGRESOS', icon: <FolderOpen size={18} /> },
    { id: 'egresos', label: 'EGRESOS', icon: <FolderOpen size={18} /> },
    { id: 'facturas', label: 'SUBIR PDF', icon: <UploadCloud size={18} /> },
    { id: 'informacion', label: 'INFORMACIÓN GENERAL', icon: <LayoutDashboard size={18} /> },
  ];

  return (
    <aside className="w-64 bg-white h-full border-r border-gray-100 flex flex-col p-6">
      {/* Header con Logo Institucional */}
      <div className="mb-10 text-center">
        {/* Aquí iría el logo real */}
        <div className="bg-gray-200 h-10 w-24 mx-auto rounded flex items-center justify-center">
          <img 
            src="https://ugelsanta.gob.pe/wp-content/uploads/2026/02/Logo_US3.png" 
            alt="Logo UGEL" 
            className="h-16 w-auto object-contain" 
            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Logo+UGEL' }}
          />
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg text-sm text-left transition-colors ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Sección Inferior - Cerrar Sesión */}
      <div className="border-t border-gray-100 pt-5 mt-auto">
        <button 
          onClick={onLogoutClick}
          className="w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg text-sm text-left text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default DirectorSidebar;
