import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import DirectorDashboard from './components/DirectorDashboard';

function App() {
  // Al cargar la app (o pulsar F5), verificamos si ya hay un usuario guardado
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Función para cerrar sesión limpiando la memoria del navegador
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <LoginForm onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <div>
      {user.rol === 'especialista' ? (
        <div className="p-10 text-center">
          <h1 className="text-3xl font-bold">Bienvenido Especialista</h1>
          <p>Aquí verás las carpetas de todos los colegios.</p>
          <button onClick={handleLogout} className="mt-4 text-blue-500 underline">Cerrar Sesión</button>
        </div>
      ) : (
        <DirectorDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;