import React, { useEffect, useRef, useState } from 'react';
import { Plus, Save, CalendarDays, X } from 'lucide-react';
import { buildApiUrl } from '../config/api';
import Toast from './Toast';

const API_URL = buildApiUrl('/api/movimientos/egresos');

const TIPOS_COMPROBANTE = [
  'Factura',
  'Boleta',
  'Recibo por Honorarios',
  'Declaración Jurada',
];

const normalizarTexto = (valor) => (
  String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
);

const MAPA_TIPOS_COMPROBANTE = {
  factura: 'Factura',
  boleta: 'Boleta',
  'recibo por honorarios': 'Recibo por Honorarios',
  'declaracion jurada': 'Declaración Jurada',
};

const normalizarTipoComprobante = (tipo) => (
  MAPA_TIPOS_COMPROBANTE[normalizarTexto(tipo)] || ''
);

const crearFilaVacia = () => ({
  id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  fecha: '',
  tipo: '',
  numero: '',
  concepto: '',
  importe: 0,
});

const formatearFechaApi = (fecha) => {
  if (!fecha) return '';
  return String(fecha).split('T')[0];
};

const filaTieneContenido = (fila) => (
  Boolean(fila.fecha)
  || Boolean(String(fila.numero || '').trim())
  || Boolean(String(fila.concepto || '').trim())
  || Number(fila.importe || 0) > 0
  || Boolean(String(fila.tipo || '').trim())
);

const leerRespuestaJson = async (response) => {
  const rawText = await response.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    if (rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<')) {
      throw new Error('El backend no devolvio JSON. Reinicia el servidor backend para cargar las nuevas rutas.');
    }

    throw new Error('La respuesta del servidor no tiene un formato JSON valido.');
  }
};

const EgresosView = ({ trimestreMeses, trimestreId, directorId, trimestreCerrado }) => {
  const dateInputRefs = useRef({});
  const [mesActivo, setMesActivo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [filasTipoInvalido, setFilasTipoInvalido] = useState(new Set());
  const [datosMeses, setDatosMeses] = useState([
    [crearFilaVacia()],
    [crearFilaVacia()],
    [crearFilaVacia()],
  ]);

  useEffect(() => {
    setMesActivo(0);
  }, [trimestreId]);

  const obtenerRangoMes = (quarterId, monthOffset) => {
    const currentYear = new Date().getFullYear();
    const quarterStartMonth = (Number(quarterId) - 1) * 3;
    const monthIndex = quarterStartMonth + monthOffset;
    const startDate = new Date(currentYear, monthIndex, 1);
    const endDate = new Date(currentYear, monthIndex + 1, 0);
    const formatear = (date) => date.toISOString().split('T')[0];

    return {
      startDate: formatear(startDate),
      endDate: formatear(endDate),
      monthNumber: monthIndex,
    };
  };

  useEffect(() => {
    const cargarEgresos = async () => {
      if (!directorId || !trimestreId) return;

      setLoading(true);
      setError('');
      setMensaje('');

      try {
        const primerMes = obtenerRangoMes(trimestreId, 0);
        const ultimoMes = obtenerRangoMes(trimestreId, 2);
        const query = new URLSearchParams({
          directorId: String(directorId),
          startDate: primerMes.startDate,
          endDate: ultimoMes.endDate,
        });

        const response = await fetch(`${API_URL}?${query.toString()}`);
        const data = await leerRespuestaJson(response);

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'No se pudieron cargar los egresos.');
        }

        const agrupados = [[], [], []];

        data.data.forEach((registro) => {
          const fecha = new Date(registro.fecha);
          const monthOffset = fecha.getMonth() - primerMes.monthNumber;

          if (monthOffset >= 0 && monthOffset < 3) {
            agrupados[monthOffset].push({
              id: registro.id,
              fecha: formatearFechaApi(registro.fecha),
              tipo: normalizarTipoComprobante(registro.tipo_comprobante),
              numero: registro.numero_comprobante || '',
              concepto: registro.concepto || '',
              importe: registro.monto ?? 0,
            });
          }
        });

        setDatosMeses(
          agrupados.map((mesRegistros) => (
            mesRegistros.length > 0 ? mesRegistros : [crearFilaVacia()]
          ))
        );
      } catch (loadError) {
        console.error(loadError);
        setError(loadError.message || 'Error cargando los egresos.');
      } finally {
        setLoading(false);
      }
    };

    cargarEgresos();
  }, [directorId, trimestreId]);

  const handleInputChange = (mesIndex, filaId, campo, valor) => {
    setDatosMeses((prevDatos) => {
      const nuevosDatos = [...prevDatos];
      nuevosDatos[mesIndex] = nuevosDatos[mesIndex].map((fila) => (
        fila.id === filaId ? { ...fila, [campo]: valor } : fila
      ));
      return nuevosDatos;
    });

    if (campo === 'tipo' && TIPOS_COMPROBANTE.includes(valor)) {
      setFilasTipoInvalido((prev) => {
        if (!prev.has(filaId)) return prev;
        const next = new Set(prev);
        next.delete(filaId);
        return next;
      });
    }
  };

  const agregarFila = (mesIndex) => {
    if (trimestreCerrado) return;

    setDatosMeses((prevDatos) => {
      const nuevosDatos = [...prevDatos];
      nuevosDatos[mesIndex] = [...nuevosDatos[mesIndex], crearFilaVacia()];
      return nuevosDatos;
    });
  };

  const eliminarFila = (mesIndex, filaId) => {
    if (trimestreCerrado) return;

    setDatosMeses((prevDatos) => {
      const nuevosDatos = [...prevDatos];
      const filtradas = nuevosDatos[mesIndex].filter((fila) => fila.id !== filaId);
      nuevosDatos[mesIndex] = filtradas.length > 0 ? filtradas : [crearFilaVacia()];
      return nuevosDatos;
    });
  };

  const calcularTotal = (mesIndex) => (
    datosMeses[mesIndex].reduce((sum, fila) => sum + parseFloat(fila.importe || 0), 0)
  );

  const formatearFechaDDMM = (fecha) => {
    if (!fecha) return '';
    const [, mes, dia] = fecha.split('-');
    return `${dia}-${mes}`;
  };

  const abrirSelectorFecha = (filaId) => {
    const input = dateInputRefs.current[filaId];
    if (!input) return;

    input.focus();
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  const guardarMesActual = async () => {
    if (trimestreCerrado) {
      setError('Este trimestre esta cerrado y no admite cambios.');
      return;
    }

    if (!directorId) {
      setError('No se encontro el director logueado.');
      return;
    }

    const { startDate, endDate } = obtenerRangoMes(trimestreId, mesActivo);
    const registros = datosMeses[mesActivo].map((fila) => ({
      fecha: fila.fecha,
      tipo_comprobante: fila.tipo,
      numero_comprobante: fila.numero,
      concepto: fila.concepto,
      monto: fila.importe,
    }));

    const filasSinTipo = datosMeses[mesActivo]
      .map((fila, index) => ({ fila, index }))
      .filter(({ fila }) => filaTieneContenido(fila) && !TIPOS_COMPROBANTE.includes(fila.tipo))
      .map(({ index }) => index + 1);
    const filaIdsSinTipo = datosMeses[mesActivo]
      .filter((fila) => filaTieneContenido(fila) && !TIPOS_COMPROBANTE.includes(fila.tipo))
      .map((fila) => fila.id);

    if (filasSinTipo.length > 0) {
      setFilasTipoInvalido(new Set(filaIdsSinTipo));
      setError(`Selecciona el Tipo de Comprobante en la(s) fila(s): ${filasSinTipo.join(', ')}.`);
      return;
    }

    setSaving(true);
    setFilasTipoInvalido(new Set());
    setError('');
    setMensaje('');

    try {
      const response = await fetch(`${API_URL}/replace-range`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          directorId,
          startDate,
          endDate,
          registros,
        }),
      });

      const data = await leerRespuestaJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo guardar el mes actual.');
      }

      setMensaje(`Se guardaron ${data.totalGuardados} registro(s) de ${trimestreMeses[mesActivo]}.`);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || 'Error guardando los egresos.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full p-2 outline-none bg-transparent text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 rounded transition-all';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-[28px] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.45)] border border-slate-200">
        <div className="flex gap-2 mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-200 overflow-x-auto">
        {trimestreMeses.map((mes, index) => (
          <button
            key={mes}
            onClick={() => setMesActivo(index)}
            className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              mesActivo === index
                ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <CalendarDays size={18} />
            {mes.toUpperCase()}
          </button>
        ))}
      </div>

        <div className="flex justify-between items-center mb-6 rounded-3xl border border-slate-300 bg-slate-50/80 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
            RELACIÓN DE EGRESOS - {trimestreMeses[mesActivo].toUpperCase()}
          </h2>
          <button
            onClick={() => agregarFila(mesActivo)}
            disabled={trimestreCerrado}
            className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-rose-700 transition-all shadow-md font-bold disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Plus size={18} /> Agregar Fila
          </button>
        </div>

        {trimestreCerrado && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Este trimestre esta cerrado. Puede revisar la informacion, pero no editarla.
          </div>
        )}

        {loading && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Cargando egresos del trimestre...
          </div>
        )}

      <Toast message={mensaje} type="success" onClose={() => setMensaje('')} />
      <Toast message={error} type="error" onClose={() => setError('')} />

        <div className="overflow-x-auto rounded-[26px] border border-slate-300 shadow-sm">
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-rose-600 to-red-600 text-white">
                <th className="border border-rose-700/50 px-4 py-3 font-bold uppercase tracking-wider w-12 text-center text-xs">N°</th>
                <th className="border border-rose-700/50 px-4 py-3 font-bold uppercase tracking-wider w-28 text-center text-xs">Fecha</th>
                <th className="border border-rose-700/50 px-4 py-3 font-bold uppercase tracking-wider w-40 text-center text-xs">Tipo Comprobante</th>
                <th className="border border-rose-700/50 px-4 py-3 font-bold uppercase tracking-wider w-36 text-center text-xs">N° Comprobante</th>
                <th className="border border-rose-700/50 px-4 py-3 font-bold uppercase tracking-wider text-left text-xs">Concepto</th>
                <th className="border border-rose-700/50 px-4 py-3 font-bold uppercase tracking-wider w-36 text-right text-xs">Importe (S/.)</th>
                <th className="border border-rose-700/50 px-4 py-3 font-bold uppercase tracking-wider w-16 text-center text-xs">Acción</th>
              </tr>
            </thead>
            <tbody>
              {datosMeses[mesActivo].map((fila, index) => (
                <tr key={fila.id} className="hover:bg-slate-50/80 transition-colors group/row">
                  <td className="border border-slate-300 px-2 py-2 text-center bg-slate-50 font-medium text-slate-500">{index + 1}</td>
                  <td className="border border-slate-300 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!trimestreCerrado) abrirSelectorFecha(fila.id);
                      }}
                      disabled={trimestreCerrado}
                      className="block w-full text-left cursor-pointer group disabled:cursor-not-allowed"
                      title="Seleccionar fecha"
                    >
                      <input
                        type="date"
                        ref={(element) => {
                          if (element) {
                            dateInputRefs.current[fila.id] = element;
                          } else {
                            delete dateInputRefs.current[fila.id];
                          }
                        }}
                        value={fila.fecha}
                        onChange={(e) => handleInputChange(mesActivo, fila.id, 'fecha', e.target.value)}
                        className="sr-only"
                        disabled={trimestreCerrado}
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      <span className="block w-full p-2 text-center font-mono text-sm font-medium text-slate-700 group-hover:bg-slate-200 rounded transition-colors pointer-events-none">
                        {fila.fecha ? formatearFechaDDMM(fila.fecha) : '--'}
                      </span>
                    </button>
                  </td>
                  <td className="border border-slate-300 p-1">
                    <select
                      value={fila.tipo}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'tipo', e.target.value)}
                      disabled={trimestreCerrado}
                      className={`${inputClass} ${filasTipoInvalido.has(fila.id) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                    >
                      <option value="">Seleccionar</option>
                      {TIPOS_COMPROBANTE.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                    {filasTipoInvalido.has(fila.id) && (
                      <p className="px-1 pt-1 text-xs text-red-600">Campo obligatorio</p>
                    )}
                  </td>
                  <td className="border border-slate-300 p-1">
                    <input
                      type="text"
                      value={fila.numero}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'numero', e.target.value)}
                      disabled={trimestreCerrado}
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-slate-300 p-1">
                    <input
                      type="text"
                      value={fila.concepto}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'concepto', e.target.value)}
                      disabled={trimestreCerrado}
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-slate-300 p-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                      value={fila.importe}
                      onChange={(e) => {
                        if (Number(e.target.value) >= 0) {
                          handleInputChange(mesActivo, fila.id, 'importe', e.target.value);
                        }
                      }}
                      disabled={trimestreCerrado}
                      className={`${inputClass} text-right font-mono text-base`}
                    />
                  </td>
                  <td className="border border-slate-300 p-1 text-center">
                    <button
                      onClick={() => eliminarFila(mesActivo, fila.id)}
                      disabled={trimestreCerrado}
                      className="bg-slate-400 text-white p-1.5 rounded-lg hover:bg-rose-600 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                      title="Eliminar fila"
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-bold">
                <td colSpan="5" className="border border-slate-700 px-4 py-3 text-right uppercase tracking-wider text-xs">
                  Total {trimestreMeses[mesActivo]}
                </td>
                <td className="border border-slate-700 px-4 py-3 text-right font-mono text-base text-rose-400">
                  {new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(calcularTotal(mesActivo))}
                </td>
                <td className="border border-slate-700 px-4 py-3 bg-slate-900"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={guardarMesActual}
            disabled={saving || loading || trimestreCerrado}
            className="flex items-center gap-2 bg-rose-600 text-white px-8 py-3.5 rounded-2xl hover:bg-rose-700 transition-all font-bold shadow-lg disabled:bg-slate-400 uppercase tracking-wide text-sm"
          >
            <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Mes Actual'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EgresosView;
