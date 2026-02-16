import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import BoardPage from './pages/Board'
import TestHarness from './pages/TestHarness'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

export default function App(){
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login/>} />
          <Route path='/register' element={<Register/>} />
          <Route path='/' element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path='/board/:id' element={<ProtectedRoute><BoardPage/></ProtectedRoute>} />
          <Route path='/test-harness' element={<ProtectedRoute><TestHarness/></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
