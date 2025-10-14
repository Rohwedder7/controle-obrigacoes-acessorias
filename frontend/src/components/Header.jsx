import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center h-16 px-6">
        {/* Espaço esquerdo (vazio) */}
        <div className="w-10"></div>
        
        {/* Logo Centralizado */}
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-200">
          <Logo size="medium" />
        </Link>
        
        {/* Notificações à direita */}
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default Header;
