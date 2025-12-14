import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar/SearchBar';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarOpen }) => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/services?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={onMenuClick}
            >
              <span className="sr-only">メニューを開く</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center ml-4 lg:ml-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-aws-orange rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AWS</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900 hidden sm:block">
                  学習アプリ
                </span>
              </div>
            </Link>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Right side - Navigation */}
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-4">
              <Link
                to="/services"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                サービス
              </Link>
              <Link
                to="/relations"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                関連マップ
              </Link>
              <Link
                to="/comparison"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                比較
              </Link>
              <Link
                to="/categories"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                カテゴリ
              </Link>
            </nav>

            {/* Search button for mobile */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => {
                // TODO: Implement mobile search modal
              }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-4">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>
    </header>
  );
};

export default Header;