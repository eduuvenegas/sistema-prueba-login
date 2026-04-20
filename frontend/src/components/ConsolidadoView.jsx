import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { buildApiUrl } from '../config/api';
import Toast from './Toast';

const formatearFechaCierre = (fecha) => {
  if (!fecha) return '';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(fecha));
};

const SALDOS_API_URL = buildApiUrl('/api/movimientos/saldos-banco');

const ConsolidadoView = ({
  trimestreId,
  directorId,
  schoolName,
  trimestreCerrado,
  cerrandoTrimestre,
  mensajeCierre,
  errorCierre,
  cerradoEn,
  onCerrarTrimestre,
}) => {
  const periodos = {
    '1': { label: '1er Trimestre', meses: ['Enero', 'Febrero', 'Marzo'], fin: '31 de Marzo' },
    '2': { label: '2do Trimestre', meses: ['Abril', 'Mayo', 'Junio'], fin: '30 de Junio' },
    '3': { label: '3er Trimestre', meses: ['Julio', 'Agosto', 'Septiembre'], fin: '30 de Septiembre' },
    '4': { label: '4to Trimestre', meses: ['Octubre', 'Noviembre', 'Diciembre'], fin: '31 de Diciembre' },
  };

  const actual = periodos[trimestreId];

  // Variables de estado para los inputs de la Sección 2
  const [saldosBanco, setSaldosBanco] = useState({
    inicial: '',
    mes0: '',
    mes1: '',
    mes2: '',
  });
  const [savingSaldos, setSavingSaldos] = useState(false);
  const [mensajeSaldos, setMensajeSaldos] = useState('');
  const [errorSaldos, setErrorSaldos] = useState('');
  const [movimientos, setMovimientos] = useState({
    ingresos: [0, 0, 0],
    egresos: [0, 0, 0]
  });

  const handleSaldoChange = (campo, valor) => {
    setSaldosBanco((prev) => ({ ...prev, [campo]: valor }));
  };

  // Cálculos automáticos
  const saldoInicialCaja = 0; // Podremos conectarlo a otro trimestre en el futuro si lo necesitas
  const totalIngresosMeses = movimientos.ingresos.reduce((sum, val) => sum + val, 0);
  const totalIngresos = saldoInicialCaja + totalIngresosMeses;
  const totalEgresos = movimientos.egresos.reduce((sum, val) => sum + val, 0);
  
  const dineroEnCaja = totalIngresos - totalEgresos;
  const dineroEnBanco = parseFloat(saldosBanco.mes2 || 0);
  const saldoDineroTotal = dineroEnCaja + dineroEnBanco;
  
  const formatCurrency = (val) => new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

  const obtenerRangoTrimestre = (quarterId) => {
    const currentYear = 2026;
    const startMonth = (Number(quarterId) - 1) * 3;
    const startDate = new Date(currentYear, startMonth, 1);
    const endDate = new Date(currentYear, startMonth + 3, 0);
    const formatear = (date) => date.toISOString().split('T')[0];
    return { startDate: formatear(startDate), endDate: formatear(endDate), startMonth };
  };

  // Cargar ingresos y egresos para la Sección 1 y 3
  useEffect(() => {
    const cargarMovimientos = async () => {
      if (!directorId || !trimestreId) return;
      try {
        const { startDate, endDate, startMonth } = obtenerRangoTrimestre(trimestreId);
        const query = new URLSearchParams({ directorId: String(directorId), startDate, endDate });

        const [resIngresos, resEgresos] = await Promise.all([
          fetch(`${buildApiUrl('/api/movimientos/ingresos')}?${query.toString()}`),
          fetch(`${buildApiUrl('/api/movimientos/egresos')}?${query.toString()}`)
        ]);

        const sumMeses = (data) => {
          const totales = [0, 0, 0];
          if (data.success && Array.isArray(data.data)) {
            data.data.forEach(item => {
              if (item.fecha) {
                const [, month] = item.fecha.split('T')[0].split('-');
                const offset = (parseInt(month, 10) - 1) - startMonth;
                if (offset >= 0 && offset < 3) totales[offset] += Number(item.monto || 0);
              }
            });
          }
          return totales;
        };

        setMovimientos({ ingresos: sumMeses(await resIngresos.json()), egresos: sumMeses(await resEgresos.json()) });
      } catch (err) {
        console.error('Error cargando movimientos de caja', err);
      }
    };
    cargarMovimientos();
  }, [directorId, trimestreId]);

  // Cargar los saldos de la base de datos al abrir o cambiar trimestre
  useEffect(() => {
    const cargarSaldos = async () => {
      if (!directorId || !trimestreId) return;
      
      try {
        const query = new URLSearchParams({ 
          directorId: String(directorId), 
          trimestreId: String(trimestreId), 
          anio: '2026' 
        });
        
        const res = await fetch(`${SALDOS_API_URL}?${query.toString()}`);
        const data = await res.json();
        
        if (res.ok && data.success && data.data) {
          setSaldosBanco({
            inicial: data.data.saldo_inicial || '',
            mes0: data.data.saldo_mes1 || '',
            mes1: data.data.saldo_mes2 || '',
            mes2: data.data.saldo_mes3 || '',
          });
        } else {
          setSaldosBanco({ inicial: '', mes0: '', mes1: '', mes2: '' });
        }
      } catch (err) {
        console.error('Error cargando saldos del banco', err);
      }
    };

    cargarSaldos();
  }, [directorId, trimestreId]);

  // Guardar los saldos en la base de datos
  const guardarSaldos = async () => {
    if (!directorId || trimestreCerrado) return;
    
    setSavingSaldos(true);
    setMensajeSaldos('');
    setErrorSaldos('');
    
    try {
      const res = await fetch(SALDOS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directorId,
          trimestreId,
          anio: 2026,
          // Convertimos al formato que probablemente espera tu base de datos
          saldos: {
            saldo_inicial: saldosBanco.inicial || 0,
            saldo_mes1: saldosBanco.mes0 || 0,
            saldo_mes2: saldosBanco.mes1 || 0,
            saldo_mes3: saldosBanco.mes2 || 0
          }
        })
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (res.ok && data.success) {
          setMensajeSaldos('Saldos de Cuenta Corriente guardados con éxito.');
          setTimeout(() => setMensajeSaldos(''), 3000);
        } else {
          throw new Error(data.message || 'Error del servidor al guardar los saldos.');
        }
      } else {
        if (res.status === 404) {
          throw new Error('Error 404: La ruta de saldos-banco no existe en el backend.');
        }
        throw new Error(`Error del servidor (Código ${res.status}). Revisa la consola de tu backend.`);
      }
    } catch (err) {
      console.error('Error guardando saldos', err);
      setErrorSaldos(err.message);
    } finally {
      setSavingSaldos(false);
    }
  };

  const tdLabelClass = 'border border-slate-300 px-4 py-3 text-sm text-slate-700';
  const tdValueClass = 'border border-slate-300 px-4 py-3 text-sm text-right font-mono text-slate-900';
  const sectionHeaderClass = 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white px-4 py-2 font-bold text-sm uppercase tracking-[0.18em] border border-sky-700 text-center';

  // Clases dinámicas: Si está cerrado se ve normal, si está abierto se resalta en amarillo
  const trEditableClass = trimestreCerrado 
    ? 'hover:bg-slate-50/80 transition-colors' 
    : 'bg-amber-50/40 hover:bg-amber-100/50 transition-colors';
    
  const tdInputContainerClass = trimestreCerrado
    ? 'border border-slate-300 p-0 text-sm text-right font-mono text-slate-900 focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-500'
    : 'border border-slate-300 p-0 text-sm text-right font-mono text-slate-900 focus-within:ring-2 focus-within:ring-inset focus-within:ring-amber-500';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200">
        <div className="mb-6 rounded-3xl border border-slate-300 bg-slate-50/80 p-5 shadow-sm">
          <div className="grid grid-cols-12 gap-2 text-sm">
            <div className="col-span-3 rounded-2xl font-bold bg-slate-200 p-3 border border-slate-300">Trimestre:</div>
            <div className="col-span-7 rounded-2xl p-3 border border-slate-300 bg-white text-center font-bold uppercase shadow-sm">
              {actual.meses.join(', ')}
            </div>
            <div className="col-span-2 rounded-2xl p-3 border border-slate-300 bg-white text-center font-bold shadow-sm">2026</div>

            <div className="col-span-3 rounded-2xl font-bold bg-slate-200 p-3 border border-slate-300">Numero de la II.EE.</div>
            <div className="col-span-9 rounded-2xl p-3 border border-slate-300 bg-white text-center font-bold shadow-sm">1580</div>

            <div className="col-span-3 rounded-2xl font-bold bg-slate-200 p-3 border border-slate-300">Nombre de la II.EE.</div>
            <div className="col-span-9 rounded-2xl p-3 border border-slate-300 bg-white text-center font-bold uppercase text-sky-800 shadow-sm">{schoolName || 'I.E. Sideral Carrion'}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[26px] border border-slate-300 shadow-sm">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr>
                <th colSpan="2" className={sectionHeaderClass}>1. DETALLE DE LOS MOVIMIENTOS DE CAJA</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan="2" className="bg-slate-100 font-bold px-4 py-2 text-xs border border-slate-300">INGRESOS</td></tr>
              <tr>
                <td className={tdLabelClass}>+ Saldo inicial del trimestre</td>
                <td className={tdValueClass}>{formatCurrency(saldoInicialCaja)}</td>
              </tr>
              {actual.meses.map((mes, index) => (
                <tr key={mes} className="hover:bg-slate-50/80 transition-colors">
                  <td className={tdLabelClass}>+ Correspondiente a {mes}</td>
                  <td className={tdValueClass}>{formatCurrency(movimientos.ingresos[index])}</td>
                </tr>
              ))}
              <tr className="bg-emerald-50/60 font-bold">
                <td className="border border-slate-300 px-4 py-3 text-right text-xs text-emerald-900">Total Ingresos del {actual.label}</td>
                <td className={tdValueClass}>{formatCurrency(totalIngresos)}</td>
              </tr>

              <tr><td colSpan="2" className="bg-slate-100 font-bold px-4 py-2 text-xs border border-slate-300 uppercase">EGRESOS</td></tr>
              {actual.meses.map((mes, index) => (
                <tr key={mes} className="hover:bg-slate-50/80 transition-colors">
                  <td className={tdLabelClass}>- Correspondiente a {mes}</td>
                  <td className={tdValueClass}>{formatCurrency(movimientos.egresos[index])}</td>
                </tr>
              ))}
              <tr className="bg-rose-50/70 font-bold">
                <td className="border border-slate-300 px-4 py-3 text-right text-xs text-rose-900">Total Egresos del {actual.label}</td>
                <td className={tdValueClass}>{formatCurrency(totalEgresos)}</td>
              </tr>

              <tr className="bg-slate-900 text-white font-bold">
                <td className="border border-slate-700 px-4 py-3 text-right">Saldo final del Trimestre</td>
                <td className="border border-slate-700 px-4 py-3 text-right font-mono">{formatCurrency(dineroEnCaja)}</td>
              </tr>

              <tr><td colSpan="2" className={sectionHeaderClass}>2. DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE</td></tr>
              <tr>
                <td colSpan="2" className="p-0 border border-slate-300">
                  <div className="flex justify-between items-center text-[11px] px-4 py-2 bg-slate-50 text-slate-600">
                    <span>Según el Estado de Cuenta mensual emitido por el Banco de la Nación:</span>
                    {!trimestreCerrado && (
                      <span className="flex items-center gap-1.5 font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Completar manualmente
                      </span>
                    )}
                  </div>
                </td>
              </tr>
              
              <tr className={trEditableClass}>
                <td className={tdLabelClass}>Saldo inicial en CTA. CTE.</td>
                <td className={tdInputContainerClass}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                    value={saldosBanco.inicial}
                    onChange={(e) => {
                      if (Number(e.target.value) >= 0) {
                        handleSaldoChange('inicial', e.target.value);
                      }
                    }}
                    disabled={trimestreCerrado}
                    className="w-full h-full px-4 py-3 bg-transparent text-right outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
                    placeholder="0.00"
                  />
                </td>
              </tr>
              {actual.meses.map((mes, index) => (
                <tr key={`cc-${mes}`} className={trEditableClass}>
                  <td className={tdLabelClass}>Saldo al terminar {mes}</td>
                  <td className={tdInputContainerClass}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                      value={saldosBanco[`mes${index}`]}
                      onChange={(e) => {
                        if (Number(e.target.value) >= 0) {
                          handleSaldoChange(`mes${index}`, e.target.value);
                        }
                      }}
                      disabled={trimestreCerrado}
                      className="w-full h-full px-4 py-3 bg-transparent text-right outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
                      placeholder="0.00"
                    />
                  </td>
                </tr>
              ))}
              
              <tr>
                <td colSpan="2" className="bg-slate-50 border border-slate-300 px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <Toast message={mensajeSaldos} type="success" onClose={() => setMensajeSaldos('')} />
                    <Toast message={errorSaldos} type="error" onClose={() => setErrorSaldos('')} />
                    <button
                      type="button"
                      onClick={guardarSaldos}
                      disabled={trimestreCerrado || savingSaldos}
                      className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sky-700 transition-all shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      <Save size={18} /> {savingSaldos ? 'Guardando...' : 'Guardar Saldos Banco'}
                    </button>
                  </div>
                </td>
              </tr>

              <tr><td colSpan="2" className={sectionHeaderClass}>3. CONSOLIDADO</td></tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="border border-slate-300 px-4 py-3 text-sm text-slate-700">Dinero en Caja</td>
                <td className="border border-slate-300 px-4 py-3 text-sm text-right font-mono text-slate-900 bg-emerald-50/30">
                  {formatCurrency(dineroEnCaja)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="border border-slate-300 px-4 py-3 text-sm text-slate-700">Dinero en Cuenta Corriente del Banco de la Nacion *</td>
                <td className="border border-slate-300 px-4 py-3 text-sm text-right font-mono text-slate-900 bg-sky-50/30">
                  {formatCurrency(dineroEnBanco)}
                </td>
              </tr>
              <tr className="bg-slate-900 text-white font-bold">
                <td className="border border-slate-700 px-4 py-3 text-right">Saldo de Dinero, al {actual.fin} 2026</td>
                <td className="border border-slate-700 px-4 py-3 text-right font-mono text-sky-400">
                  {formatCurrency(saldoDineroTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 space-y-4">
          {mensajeCierre && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {mensajeCierre}
            </div>
          )}

          {errorCierre && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorCierre}
            </div>
          )}

          {trimestreCerrado && (
            <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              Trimestre cerrado{cerradoEn ? ` el ${formatearFechaCierre(cerradoEn)}` : ''}.
            </div>
          )}

          <button
            type="button"
            onClick={onCerrarTrimestre}
            disabled={trimestreCerrado || cerrandoTrimestre}
            className={`w-full rounded-2xl py-4 text-lg font-bold uppercase tracking-wide transition-all ${
              trimestreCerrado
                ? 'cursor-not-allowed bg-slate-400 text-white'
                : 'bg-red-700 text-white shadow-lg hover:bg-red-800'
            }`}
          >
            {cerrandoTrimestre ? 'Cerrando...' : 'Cerrar Trimestre'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsolidadoView;
