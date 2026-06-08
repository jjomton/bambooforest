import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Signup } from '@/pages/Signup';
import { Login } from '@/pages/Login';
import { BoardList } from '@/pages/BoardList';
import { PostCreate } from '@/pages/PostCreate';
import { PostDetail } from '@/pages/PostDetail';
import { AdminDashboard } from '@/pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 기본 경로는 게시판 목록으로 리다이렉트 */}
          <Route path="/" element={<Navigate to="/board" replace />} />
          
          {/* 주요 경로 구성 */}
          <Route path="/board" element={<BoardList />} />
          <Route path="/board/:id" element={<PostDetail />} />
          <Route path="/board/new" element={<PostCreate />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* 그 외 예외 경로는 게시판 목록으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/board" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
