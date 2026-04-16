import React, { useEffect, useRef, useState } from 'react';
import { Plus, Save, CalendarDays, X } from 'lucide-react';
import { buildApiUrl } from '../config/api';

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

const EgresosView = ({ trimestreMeses, trimestreId, directorId }) => {
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
    setDatosMeses((prevDatos) => {
      const nuevosDatos = [...prevDatos];
      nuevosDatos[mesIndex] = [...nuevosDatos[mesIndex], crearFilaVacia()];
      return nuevosDatos;
    });
  };

  const eliminarFila = (mesIndex, filaId) => {
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

  const inputClass = 'w-full p-1 outline-none bg-transparent';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex bg-gray-50 border-b border-gray-200">
        {trimestreMeses.map((mes, index) => (
          <button
            key={mes}
            onClick={() => setMesActivo(index)}
            className={`px-8 py-4 text-sm font-bold transition-all border-r border-gray-200 flex items-center gap-2 ${
              mesActivo === index
                ? 'bg-white text-red-900 border-t-4 border-t-red-800 shadow-sm'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <CalendarDays size={16} />
            {mes.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            RELACION DE EGRESOS - {trimestreMeses[mesActivo].toUpperCase()}
          </h2>
          <button
            onClick={() => agregarFila(mesActivo)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-all shadow-md font-medium"
          >
            <Plus size={18} /> Agregar Fila
          </button>
        </div>

        {loading && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Cargando egresos del trimestre...
          </div>
        )}

        {mensaje && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 w-10">N°</th>
                <th className="border border-gray-300 p-2 w-24">Fecha</th>
                <th className="border border-gray-300 p-2 w-32">Tipo de Comprobante</th>
                <th className="border border-gray-300 p-2 w-32">Numero Comprobante</th>
                <th className="border border-gray-300 p-2">Concepto</th>
                <th className="border border-gray-300 p-2 w-32">Importe (S/.)</th>
                <th className="border border-gray-300 p-2 w-12">Accion</th>
              </tr>
            </thead>
            <tbody>
              {datosMeses[mesActivo].map((fila, index) => (
                <tr key={fila.id} className="hover:bg-red-50/30">
                  <td className="border border-gray-300 p-2 text-center bg-gray-50">{index + 1}</td>
                  <td className="border border-gray-300 p-1">
                    <button
                      type="button"
                      onClick={() => abrirSelectorFecha(fila.id)}
                      className="block w-full text-left cursor-pointer group"
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
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      <span className="block w-full p-1 text-center font-mono text-sm text-gray-700 group-hover:bg-red-100 rounded pointer-events-none">
                        {fila.fecha ? formatearFechaDDMM(fila.fecha) : '--'}
                      </span>
                    </button>
                  </td>
                  <td className="border border-gray-300 p-1">
                    <select
                      value={fila.tipo}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'tipo', e.target.value)}
                      className={`${inputClass} ${filasTipoInvalido.has(fila.id) ? 'border border-red-500 rounded' : ''}`}
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
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={fila.numero}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'numero', e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={fila.concepto}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'concepto', e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="number"
                      value={fila.importe}
                      onChange={(e) => handleInputChange(mesActivo, fila.id, 'importe', e.target.value)}
                      className={`${inputClass} text-right font-mono text-base text-black-700`}
                    />
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    <button
                      onClick={() => eliminarFila(mesActivo, fila.id)}
                      className="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600 transition-all"
                      title="Eliminar fila"
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan="5" className="border border-gray-300 p-2 text-right uppercase tracking-wider">
                  Total
                </td>
                <td className="border border-gray-300 p-2 text-right text-red-700 font-mono text-lg bg-red-50">
                  {new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(calcularTotal(mesActivo))}
                </td>
                <td className="border border-gray-300 p-2 bg-transparent"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={guardarMesActual}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all font-bold shadow-lg disabled:bg-gray-400"
          >
            <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Mes Actual'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EgresosView;
