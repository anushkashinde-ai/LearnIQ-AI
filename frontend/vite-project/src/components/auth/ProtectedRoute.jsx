import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AppLayout from '../layout/AppLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const ProtectedRoute = () => {

    const {isAuthenticated, loading} = useAuth()

    if(loading){
      return <div>Loading...</div>
    }

    return isAuthenticated ? (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ) : (
      <Navigate to="/login" replace/>
    )
}

export default ProtectedRoute