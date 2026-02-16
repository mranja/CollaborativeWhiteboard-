import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import BoardPage from './pages/Board'
import TestHarness from './pages/TestHarness'
import Login from './pages/Login'
import Register from './pages/Register'
import AcceptInvite from './pages/AcceptInvite'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

export default function App(){
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Landing/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/register' element={<Register/>} />
          <Route path='/dashboard' element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path='/board/:id' element={<ProtectedRoute><BoardPage/></ProtectedRoute>} />
          <Route path='/invite/accept/:token' element={<ProtectedRoute><AcceptInvite/></ProtectedRoute>} />
          <Route path='/test-harness' element={<ProtectedRoute><TestHarness/></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
