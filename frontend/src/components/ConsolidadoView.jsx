import React from 'react';

const ConsolidadoView = ({ trimestreId, schoolName }) => {
  // Definición de periodos (esto actualiza los nombres en la tabla)
  const periodos = {
    '1': { label: '1er Trimestre', meses: ['Enero', 'Febrero', 'Marzo'], fin: '31 de Marzo' },
    '2': { label: '2do Trimestre', meses: ['Abril', 'Mayo', 'Junio'], fin: '30 de Junio' },
    '3': { label: '3er Trimestre', meses: ['Julio', 'Agosto', 'Septiembre'], fin: '30 de Septiembre' },
    '4': { label: '4to Trimestre', meses: ['Octubre', 'Noviembre', 'Diciembre'], fin: '31 de Diciembre' },
  };

  const actual = periodos[trimestreId];

  // Estilos de celda para imitar el formato oficial
  const tdLabelClass = 'border border-gray-800 px-3 py-2 text-sm text-gray-700';
  const tdValueClass = 'border border-gray-800 px-3 py-2 text-sm text-right font-mono';
  const sectionHeaderClass = 'bg-sky-500 text-white px-3 py-1.5 font-bold text-sm uppercase tracking-wide border border-sky-600 text-center';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-none shadow-lg border border-gray-200">
        <div className="border-2 border-gray-800 p-4 mb-6">
          <div className="grid grid-cols-12 gap-2 text-sm">
            <div className="col-span-3 font-bold bg-gray-200 p-2 border border-gray-800">Trimestre:</div>
            <div className="col-span-7 p-2 border border-gray-800 text-center font-bold uppercase">
              {actual.meses.join(', ')}
            </div>
            <div className="col-span-2 p-2 border border-gray-800 text-center font-bold">2026</div>

            <div className="col-span-3 font-bold bg-gray-200 p-2 border border-gray-800">Número de la II.EE.</div>
            <div className="col-span-9 p-2 border border-gray-800 text-center font-bold">1580</div>

            <div className="col-span-3 font-bold bg-gray-200 p-2 border border-gray-800">Nombre de la II.EE.</div>
            <div className="col-span-9 p-2 border border-gray-800 text-center font-bold uppercase text-blue-800">{schoolName || 'I.E. Sideral Carrión'}</div>
          </div>
        </div>

        <table className="w-full border-collapse border border-gray-800">
          <thead>
            <tr>
              <th colSpan="2" className={sectionHeaderClass}>1. DETALLE DE LOS MOVIMIENTOS DE CAJA</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan="2" className="bg-gray-100 font-bold px-3 py-1 text-xs border border-gray-800">INGRESOS</td></tr>
            <tr>
              <td className={tdLabelClass}>+ Saldo inicial del trimestre</td>
              <td className={tdValueClass}>0.00</td>
            </tr>
            {actual.meses.map((mes) => (
              <tr key={mes}>
                <td className={tdLabelClass}>+ Correspondiente a {mes}</td>
                <td className={tdValueClass}>0.00</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td className="border border-gray-800 px-3 py-2 text-right text-xs">Total Ingresos del {actual.label}</td>
              <td className={tdValueClass}>0.00</td>
            </tr>

            <tr><td colSpan="2" className="bg-gray-100 font-bold px-3 py-1 text-xs border border-gray-800 uppercase">EGRESOS</td></tr>
            {actual.meses.map((mes) => (
              <tr key={mes}>
                <td className={tdLabelClass}>- Correspondiente a {mes}</td>
                <td className={tdValueClass}>0.00</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td className="border border-gray-800 px-3 py-2 text-right text-xs">Total Egresos del {actual.label}</td>
              <td className={tdValueClass}>0.00</td>
            </tr>

            <tr className="bg-black text-white font-bold">
              <td className="border border-gray-800 px-3 py-2 text-right">Saldo final del Trimestre</td>
              <td className="border border-gray-800 px-3 py-2 text-right font-mono">0.00</td>
            </tr>

            <tr><td colSpan="2" className={sectionHeaderClass}>2. DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE</td></tr>
            <tr><td colSpan="2" className="text-[10px] px-3 py-1 bg-gray-50 text-gray-600 border border-gray-800">Según el Estado de Cuenta mensual emitido por el Banco de la Nación:</td></tr>
            {actual.meses.map((mes) => (
              <tr key={`cc-${mes}`}>
                <td className={tdLabelClass}>Saldo al terminar {mes}</td>
                <td className={tdValueClass}>0.00</td>
              </tr>
            ))}

            <tr><td colSpan="2" className={sectionHeaderClass}>3. CONSOLIDADO</td></tr>
            <tr>
              <td className="border border-gray-800 px-3 py-2 text-sm text-gray-700">Dinero en Caja</td>
              <td className="border border-gray-800 px-3 py-2 text-sm text-right font-mono">0.00</td>
            </tr>
            <tr>
              <td className="border border-gray-800 px-3 py-2 text-sm text-gray-700">Dinero en Cuenta Corriente del Banco de la Nación *</td>
              <td className="border border-gray-800 px-3 py-2 text-sm text-right font-mono">0.00</td>
            </tr>
            <tr className="bg-black text-white font-bold">
              <td className="border border-gray-800 px-3 py-2 text-right">Saldo de Dinero, al {actual.fin} 2026</td>
              <td className="border border-gray-800 px-3 py-2 text-right font-mono">0.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsolidadoView;
