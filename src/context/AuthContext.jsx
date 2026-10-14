import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { avatarFor } from '../utils/mockImage.js';
import { authAPI, setToken } from '../services/api.js';

export const AuthContext = createContext(null);
const SESSION_KEY = 'findit_session_user';

export function AuthProvider({ children }) {
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const token=localStorage.getItem('findit_token');
    if(!token){setLoading(false);return;}
    authAPI.me().then(res=>{if(res.success){setUser(res.data);localStorage.setItem(SESSION_KEY,JSON.stringify(res.data));}})
      .catch(()=>{setToken(null);localStorage.removeItem(SESSION_KEY);setUser(null);})
      .finally(()=>setLoading(false));
  },[]);

  const login=useCallback(async(email,password,role)=>{
    const res=await authAPI.login({email,password,role});
    if(!res.success) throw new Error(res.message||'Login failed.');
    setToken(res.token);localStorage.setItem(SESSION_KEY,JSON.stringify(res.data));setUser(res.data);return res.data;
  },[]);

  const register=useCallback(async(payload)=>{
    const res=await authAPI.register(payload);
    if(!res.success) throw new Error(res.message||'Registration failed.');
    // Registration does not auto-login; keep token cleared so the user logs in explicitly.
    setToken(null);return res.data;
  },[]);

  const loginWithGoogle = useCallback(async (idToken, role) => {
    const res = await authAPI.googleLogin({ idToken, role });
    if (!res.success) throw new Error(res.message || 'Google sign-in failed.');
    setToken(res.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  }, []);

  const logout=useCallback(()=>{setToken(null);localStorage.removeItem(SESSION_KEY);setUser(null);},[]);

  const updateProfile=useCallback(async(patch)=>{
    const res=await authAPI.updateProfile(patch);
    if(!res.success) throw new Error(res.message||'Profile update failed.');
    setUser(res.data);localStorage.setItem(SESSION_KEY,JSON.stringify(res.data));return res.data;
  },[]);

  const value=useMemo(()=>({
    user,loading,isAuthenticated:Boolean(user),isAdmin:user?.role==='admin',isTeacher:user?.role==='teacher',
    login,register,logout,updateProfile,loginWithGoogle,photoUrl:user?(user.photo||avatarFor(user.name)):''
  }),[user,loading,login,register,logout,updateProfile,loginWithGoogle]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
