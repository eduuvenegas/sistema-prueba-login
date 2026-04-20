import React, { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import DirectorSidebar from './DirectorSidebar';
import LogoutModal from './LogoutModal';
import ChangePasswordModal from './ChangePasswordModal';
import CerrarTrimestreModal from './CerrarTrimestreModal';
import ConsolidadoView from './ConsolidadoView';
import InformacionGeneralView from './InformacionGeneralView';
import IngresosView from './IngresosView';
import EgresosView from './EgresosView';
import SubirPDFView from './SubirPDFView';
import { buildApiUrl } from '../config/api';

const CIERRES_API_URL = buildApiUrl('/api/movimientos/cierres');

const leerRespuestaJson = async (response) => {
  const rawText = await response.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    throw new Error('La respuesta del servidor no tiene un formato JSON valido.');
  }
};

const DirectorDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [trimestreId, setTrimestreId] = useState('1');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isCerrarTrimestreOpen, setIsCerrarTrimestreOpen] = useState(false);
  const [trimestreCerrado, setTrimestreCerrado] = useState(false);
  const [cerrandoTrimestre, setCerrandoTrimestre] = useState(false);
  const [cerradoEn, setCerradoEn] = useState(null);
  const [mensajeCierre, setMensajeCierre] = useState('');
  const [errorCierre, setErrorCierre] = useState('');

  const periodos = {
    '1': ['Enero', 'Febrero', 'Marzo'],
    '2': ['Abril', 'Mayo', 'Junio'],
    '3': ['Julio', 'Agosto', 'Septiembre'],
    '4': ['Octubre', 'Noviembre', 'Diciembre'],
  };

  const anioActual = new Date().getFullYear();

  useEffect(() => {
    const cargarEstadoCierre = async () => {
      if (!user.director?.id || !trimestreId) return;

      setErrorCierre('');
      setMensajeCierre('');

      try {
        const query = new URLSearchParams({
          directorId: String(user.director.id),
          anio: String(anioActual),
          trimestreId: String(trimestreId),
        });

        const response = await fetch(`${CIERRES_API_URL}/estado?${query.toString()}`);
        const data = await leerRespuestaJson(response);

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'No se pudo consultar el cierre del trimestre.');
        }

        setTrimestreCerrado(Boolean(data.data?.trimestreCerrado));
        setCerradoEn(data.data?.cerradoEn || null);
      } catch (loadError) {
        console.error(loadError);
        setErrorCierre(loadError.message || 'No se pudo consultar el cierre del trimestre.');
      }
    };

    cargarEstadoCierre();
  }, [anioActual, trimestreId, user.director?.id]);

  const handleCerrarTrimestre = async () => {
    if (trimestreCerrado || !user.director?.id) return;

    setCerrandoTrimestre(true);
    setErrorCierre('');
    setMensajeCierre('');

    try {
      const response = await fetch(CIERRES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          directorId: user.director.id,
          anio: anioActual,
          trimestreId,
        }),
      });

      const data = await leerRespuestaJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo cerrar el trimestre.');
      }

      setTrimestreCerrado(true);
      setCerradoEn(data.data?.cerradoEn || new Date().toISOString());
      setMensajeCierre('El trimestre fue cerrado y ya no admite cambios.');
      setIsCerrarTrimestreOpen(false);
    } catch (closeError) {
      console.error(closeError);
      setErrorCierre(closeError.message || 'No se pudo cerrar el trimestre.');
    } finally {
      setCerrandoTrimestre(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DirectorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-10">
        <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Panel de Director: {user.director?.school || 'N/A'}</h1>

          <div className="flex items-center gap-4">
            <select
              value={trimestreId}
              onChange={(e) => setTrimestreId(e.target.value)}
              className="bg-blue-50 border border-blue-200 text-blue-700 py-2 px-4 rounded-lg font-bold outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="1">1er Trimestre</option>
              <option value="2">2do Trimestre</option>
              <option value="3">3er Trimestre</option>
              <option value="4">4to Trimestre</option>
            </select>
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              title="Cambiar contrasena"
            >
              <Settings size={20} />
              Configuracion
            </button>
          </div>
        </div>

        {activeTab === 'general' && (
          <ConsolidadoView
            trimestreId={trimestreId}
            directorId={user.director?.id}
            schoolName={user.director?.school}
            trimestreCerrado={trimestreCerrado}
            cerrandoTrimestre={cerrandoTrimestre}
            mensajeCierre={mensajeCierre}
            errorCierre={errorCierre}
            cerradoEn={cerradoEn}
            onCerrarTrimestre={() => setIsCerrarTrimestreOpen(true)}
          />
        )}

        {activeTab === 'ingresos' && (
          <IngresosView
            trimestreMeses={periodos[trimestreId]}
            trimestreId={trimestreId}
            directorId={user.director?.id}
            trimestreCerrado={trimestreCerrado}
          />
        )}

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={onLogout}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          userEmail={user.email}
        />

        <CerrarTrimestreModal
          isOpen={isCerrarTrimestreOpen}
          onClose={() => {
            if (!cerrandoTrimestre) setIsCerrarTrimestreOpen(false);
          }}
          onConfirm={handleCerrarTrimestre}
          loading={cerrandoTrimestre}
        />

        {activeTab === 'egresos' && (
          <EgresosView
            trimestreMeses={periodos[trimestreId]}
            trimestreId={trimestreId}
            directorId={user.director?.id}
            trimestreCerrado={trimestreCerrado}
          />
        )}
        {activeTab === 'facturas' && (
          <SubirPDFView 
            trimestreMeses={periodos[trimestreId]} 
            trimestreId={trimestreId} 
            directorId={user.director?.id} 
          />
        )}
        {activeTab === 'informacion' && <InformacionGeneralView director={user.director} />}
      </main>
    </div>
  );
};

export default DirectorDashboard;
