import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-bamboo-bg flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-[768px] mx-auto px-5 py-6">
        {children}
      </main>
      <footer className="w-full max-w-[768px] mx-auto px-5 py-8 text-center text-xs text-bamboo-text-muted border-t border-tamboo-border/50 mt-12">
        <p>© 2026 휴먼 대나무숲. All rights reserved.</p>
        <p className="mt-1 text-[10px]">본 서비스는 완전한 익명성을 바탕으로 작동되며 개인정보 수집을 최소화합니다.</p>
      </footer>
    </div>
  );
};
