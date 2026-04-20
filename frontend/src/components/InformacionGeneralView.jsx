import React from 'react';

const obtenerNombreCompleto = (director) => {
  const partes = [
    director?.nombres,
    director?.apellido_paterno,
    director?.apellido_materno,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(' ') : 'No disponible';
};

const InformacionGeneralView = ({ director }) => {
  const datos = [
    { label: 'Nombre de la I.E.', value: director?.school || 'No disponible' },
    { label: 'Director(a)', value: obtenerNombreCompleto(director) },
    { label: 'DNI', value: director?.dni || 'No disponible' },
    { label: 'Celular', value: director?.celular || 'No disponible' },
    { label: 'Correo', value: director?.email || 'No disponible' },
  ];

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-2xl bg-white border border-gray-200 shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center">INFORMACIÓN GENERAL</h2>
        <p className="text-center text-sm text-gray-500 mt-2 mb-8">
          Resumen de datos institucionales
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datos.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{item.label}</p>
              <p className="text-base font-semibold text-gray-800 mt-1 break-words">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InformacionGeneralView;