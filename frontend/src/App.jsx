import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import ProductsPage  from './pages/ProductsPage';
import ProductDetail from './pages/ProductDetail';
import OrdersPage    from './pages/OrdersPage';
import ProfilePage   from './pages/ProfilePage';
import AdminPage     from './pages/AdminPage';
import FilesPage     from './pages/FilesPage';
import ToolsPage     from './pages/ToolsPage';

export const AuthContext = createContext(null);

export function useAuth() { return useContext(AuthContext); }

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar">
      <Link className="brand" to="/">VulnMart</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Link to="/products">Shop</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/files">Files</Link>
        <Link to="/tools">Tools</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user ? (
          <>
            <Link to="/profile">{user.username}</Link>
            <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser]   = useState(() => { try { return JSON.parse(localStorage.getItem('vulnmart_user')); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem('vulnmart_token') || '');

  function login(u, t) {
    setUser(u); setToken(t);
    localStorage.setItem('vulnmart_user',  JSON.stringify(u));
    localStorage.setItem('vulnmart_token', t);
  }

  function logout() {
    setUser(null); setToken('');
    localStorage.removeItem('vulnmart_user');
    localStorage.removeItem('vulnmart_token');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <BrowserRouter>
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/"             element={<Navigate to="/products" />} />
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/register"     element={<RegisterPage />} />
            <Route path="/products"     element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/orders"       element={<OrdersPage />} />
            <Route path="/profile"      element={<ProfilePage />} />
            <Route path="/admin"        element={<AdminPage />} />
            <Route path="/files"        element={<FilesPage />} />
            <Route path="/tools"        element={<ToolsPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
