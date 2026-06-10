import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Signup } from '@/pages/Signup';
import { Login } from '@/pages/Login';
import { BoardList } from '@/pages/BoardList';
import { PostCreate } from '@/pages/PostCreate';
import { PostDetail } from '@/pages/PostDetail';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { Portfolio } from '@/pages/Portfolio';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* 포트폴리오 메인 화면 */}
          <Route path="/" element={<Portfolio />} />
          
          {/* 대나무숲 주요 경로 구성 */}
          <Route path="/board" element={<BoardList />} />
          <Route path="/board/:id" element={<PostDetail />} />
          <Route path="/board/new" element={<PostCreate />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* 그 외 예외 경로는 포트폴리오 메인으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
