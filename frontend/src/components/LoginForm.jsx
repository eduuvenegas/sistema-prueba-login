import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { buildApiUrl } from '../config/api';

const LoginForm = ({ onLoginSuccess }) => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          correo: correo.trim(),
          password: password 
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Pequeña pausa artificial para mostrar la animación fluida antes de cambiar de vista
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1500); 
      } else {
        setError(data.message || 'Error en la autenticación');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error conectando con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center relative overflow-hidden">
        
        {/* Overlay de Carga con Medio Círculo Giratorio */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            {/* Spinner (Medio círculo azul gracias a border-t y border-b transparentes) */}
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 border-r-blue-600 rounded-full animate-spin mb-4 shadow-sm"></div>
            <p className="text-blue-700 font-bold animate-pulse tracking-wide">
              Ingresando al sistema...
            </p>
          </div>
        )}

        {/* Logo Real desde URL */}
        <div className="mb-6 flex justify-center">
          <img 
            src="https://ugelsanta.gob.pe/wp-content/uploads/2026/02/Logo_US3.png" 
            alt="Logo UGEL" 
            className="h-16 w-auto object-contain" 
            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Logo+UGEL' }}
          />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Sistema de Gestión Financiera Educativa
        </h1>
        <p className="text-gray-500 mb-8">Bienvenido. Por favor, inicie sesión.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Correo */}
          <div className="text-left">
            <label className="text-sm font-semibold text-gray-700 block mb-1">Correo Electrónico</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400 size={20}" />
              <input
                type="email"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-colors"
                placeholder="Correo Electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="text-left relative">
            <label className="text-sm font-semibold text-gray-700 block mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 size={20}" />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 pl-10 pr-12 outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-all shadow-md active:scale-95"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <button type="button" className="text-blue-600 text-sm block mt-6 hover:underline w-full text-center">
        ¿Olvidó su contraseña?
        </button>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">
            Acceso exclusivo para personal autorizado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
