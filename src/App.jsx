import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, Heart, Send, Search, Users, Database, 
  ShieldCheck, UserPlus, Trash2, LogOut, Lock, User, Key, AlertCircle, Edit3, X, Check, ArrowLeft, GraduationCap, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function SchoolfessApp() {
  // State Sesi User
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('yp17_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('feed');

  // Form Login State
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Database States (Supabase)
  const [menfessList, setMenfessList] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Menfess State
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState('#Crush');
  const [text, setText] = useState('');

  // Toast State ala React Bits (support tipe: 'success', 'error', 'info')
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Form Tambah Siswa (Admin)
  const [newNisn, setNewNisn] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('X');

  // Modal Edit & Konfirmasi CRUD State (Admin)
  const [editingStudent, setEditingStudent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('X');

  // Modal Konfirmasi Interaktif (Admin)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: null,
    payload: null
  });

  // Search & Filter
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  // Helper Trigger Toast Ala React Bits
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  // Sync Sesi User ke LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('yp17_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('yp17_session');
    }
  }, [currentUser]);

  // FETCH DATA DARI SUPABASE & REAL-TIME SUBSCRIPTION
  useEffect(() => {
    fetchMenfess();
    fetchStudents();

    const menfessChannel = supabase
      .channel('public:menfess')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menfess' }, () => {
        fetchMenfess();
      })
      .subscribe();

    const studentChannel = supabase
      .channel('public:students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(menfessChannel);
      supabase.removeChannel(studentChannel);
    };
  }, []);

  const fetchMenfess = async () => {
    try {
      const { data, error } = await supabase
        .from('menfess')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenfessList(data || []);
    } catch (err) {
      console.error('Error fetching menfess:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err.message);
    }
  };

  // Handler Login Siswa
  const handleSiswaLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const inputNisn = loginIdentifier.trim();
    const foundStudent = students.find(s => String(s.nisn).trim() === inputNisn);
    
    if (foundStudent) {
      const user = { role: 'siswa', name: foundStudent.name, nisn: foundStudent.nisn, class: foundStudent.class };
      setCurrentUser(user);
      setActiveTab('feed');
      showToast(`Selamat datang kembali, ${foundStudent.name}! 👋`, 'success');
    } else {
      const { data } = await supabase.from('students').select('*').eq('nisn', inputNisn).maybeSingle();
      if (data) {
        const user = { role: 'siswa', name: data.name, nisn: data.nisn, class: data.class };
        setCurrentUser(user);
        setActiveTab('feed');
        showToast(`Selamat datang kembali, ${data.name}! 👋`, 'success');
      } else {
        setLoginError('NISN tidak terdaftar di database SMA YP17! Hubungi Admin.');
      }
    }
  };

  // Handler Login Admin
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginIdentifier.trim() === 'admin' && loginPassword === 'admin123') {
      const user = { role: 'admin', name: 'Administrator YP17', nisn: 'admin_yp17' };
      setCurrentUser(user);
      setActiveTab('database');
      showToast('Berhasil masuk sebagai Admin YP17 🛡️', 'success');
    } else {
      setLoginError('Username atau Password Admin salah! (Default: admin / admin123)');
    }
  };

  // Handler Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedPortal(null);
    setLoginIdentifier('');
    setLoginPassword('');
    setLoginError('');
    showToast('Berhasil keluar dari sesi.', 'info');
  };

  // Handler Kirim Menfess (Full AJAX + Instant Local Update + React Bits Toast)
  const handleSendMenfess = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      showToast('Isi pesan menfess wajib diisi!', 'error');
      return;
    }

    const newPost = {
      sender: sender.trim() || currentUser?.name || 'Anonim',
      recipient: recipient.trim() || 'Semua Warga YP17',
      category,
      text: text.trim(),
      likes: 0,
      liked_by: [],
      comments: []
    };

    const { data, error } = await supabase.from('menfess').insert([newPost]).select('*');

    if (error) {
      showToast('Gagal mengirim menfess: ' + error.message, 'error');
    } else {
      if (data && data.length > 0) {
        setMenfessList((prevList) => [data[0], ...prevList]);
      }

      setText('');
      setRecipient('');
      setSender('');
      
      showToast('✨ Menfess berhasil dikirim ke feed!', 'success');
      setActiveTab('feed');
    }
  };

  // Handler Like (1 Akun Hanya Bisa Like 1 Kali)
  const handleLike = async (item) => {
    const userIdentifier = currentUser?.nisn || currentUser?.name;
    if (!userIdentifier) return;

    const currentLikedBy = item.liked_by || [];

    if (currentLikedBy.includes(userIdentifier)) {
      showToast('Kamu sudah menyukai menfess ini!', 'info');
      return;
    }

    const updatedLikedBy = [...currentLikedBy, userIdentifier];
    const newLikesCount = (item.likes || 0) + 1;

    const { error } = await supabase
      .from('menfess')
      .update({ 
        likes: newLikesCount,
        liked_by: updatedLikedBy 
      })
      .eq('id', item.id);

    if (!error) {
      setMenfessList(menfessList.map(m => m.id === item.id ? { ...m, likes: newLikesCount, liked_by: updatedLikedBy } : m));
      showToast('❤️ Menfess disukai!', 'success');
    }
  };

  // Handler Komentar (Instant AJAX Update)
  const handleAddComment = async (item) => {
    const commentText = commentInputs[item.id];
    if (!commentText || !commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      author: currentUser?.role === 'admin' ? 'Admin YP17' : currentUser?.name || 'Siswa YP17',
      text: commentText.trim()
    };

    const updatedComments = [...(item.comments || []), newComment];

    const { error } = await supabase
      .from('menfess')
      .update({ comments: updatedComments })
      .eq('id', item.id);

    if (error) {
      showToast('Gagal menambah komentar: ' + error.message, 'error');
    } else {
      setCommentInputs({ ...commentInputs, [item.id]: '' });
      setMenfessList(menfessList.map(m => m.id === item.id ? { ...m, comments: updatedComments } : m));
      showToast('💬 Komentar terkirim!', 'success');
    }
  };

  // --- ADMIN MODAL CONFIRMATION EXECUTOR ---
  const triggerConfirmModal = (title, message, actionType, payload) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      actionType,
      payload
    });
  };

  const executeConfirmedAction = async () => {
    const { actionType, payload } = confirmModal;
    setConfirmModal({ isOpen: false, title: '', message: '', actionType: null, payload: null });

    if (actionType === 'ADD_STUDENT') {
      const { error } = await supabase.from('students').insert([payload]);
      if (error) {
        showToast('Gagal menambah siswa: ' + error.message, 'error');
      } else {
        setNewNisn('');
        setNewName('');
        fetchStudents();
        showToast('Data siswa berhasil ditambahkan!', 'success');
      }
    } else if (actionType === 'UPDATE_STUDENT') {
      const { nisn, name, class: kelas } = payload;
      const { error } = await supabase
        .from('students')
        .update({ name, class: kelas })
        .eq('nisn', nisn);
      if (error) {
        showToast('Gagal mengedit siswa: ' + error.message, 'error');
      } else {
        setEditingStudent(null);
        fetchStudents();
        showToast('Data siswa berhasil diperbarui!', 'success');
      }
    } else if (actionType === 'DELETE_STUDENT') {
      const { error } = await supabase.from('students').delete().eq('nisn', payload);
      if (error) {
        showToast('Gagal menghapus siswa: ' + error.message, 'error');
      } else {
        fetchStudents();
        showToast('Data siswa berhasil dihapus.', 'info');
      }
    } else if (actionType === 'DELETE_MENFESS') {
      const { error } = await supabase.from('menfess').delete().eq('id', payload);
      if (error) {
        showToast('Gagal menghapus menfess: ' + error.message, 'error');
      } else {
        setMenfessList(menfessList.filter(m => m.id !== payload));
        showToast('Menfess berhasil dihapus oleh admin.', 'info');
      }
    }
  };

  const handleAddStudentSubmit = (e) => {
    e.preventDefault();
    if (!newNisn.trim() || !newName.trim()) {
      showToast('NISN dan Nama lengkap wajib diisi!', 'error');
      return;
    }
    triggerConfirmModal(
      'Konfirmasi Tambah Siswa',
      `Apakah Anda yakin ingin mendaftarkan ${newName.trim()} (NISN: ${newNisn.trim()}) ke database?`,
      'ADD_STUDENT',
      { nisn: newNisn.trim(), name: newName.trim(), class: newClass }
    );
  };

  const handleUpdateStudentSubmit = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Nama siswa tidak boleh kosong!', 'error');
      return;
    }
    triggerConfirmModal(
      'Konfirmasi Perubahan Data',
      `Simpan perubahan data untuk siswa ${editName.trim()}?`,
      'UPDATE_STUDENT',
      { nisn: editingStudent.nisn, name: editName.trim(), class: editClass }
    );
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Baru saja';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Filters
  const filteredMenfess = menfessList.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sender.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredStudents = students.filter(s => 
    (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    String(s.nisn || '').includes(studentSearch) ||
    (s.class || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  // ==========================================
  // APP VIEW 1: LOGIN PORTAL
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans relative">
        
        {/* REACT BITS STYLE SWIPEABLE TOAST NOTIFICATION */}
        {toast.show && (
          <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform translate-y-0 opacity-100 animate-slideDown">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md text-xs font-medium cursor-pointer ${
              toast.type === 'error' ? 'bg-rose-950/80 border-rose-800 text-rose-200' :
              toast.type === 'info' ? 'bg-slate-800/90 border-slate-700 text-slate-200' :
              'bg-slate-900/90 border-indigo-500/40 text-indigo-200 shadow-indigo-500/10'
            }`} onClick={() => setToast(prev => ({ ...prev, show: false }))}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                toast.type === 'error' ? 'bg-rose-500' :
                toast.type === 'info' ? 'bg-slate-400' : 'bg-indigo-400'
              }`} />
              <span>{toast.message}</span>
              <span className="text-[10px] text-slate-400 ml-2 border-l border-slate-700 pl-2">Geser/Tutup</span>
            </div>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden animate-fadeIn">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-2 rounded-[1.75rem] shadow-lg mb-1 bg-transparent">
              <img src="/logo.png" alt="Logo YP17" className="h-16 w-auto object-contain rounded-[1.25rem]" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Schoolfess SMA YP17</h1>
            <p className="text-xs text-slate-400">Platform Aspirasi & Menfess Resmi SMA YP17</p>
          </div>

          {selectedPortal === null && (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-center text-slate-300 font-semibold uppercase tracking-wider">Silakan Pilih Akses Login:</p>
              
              <button
                type="button"
                onClick={() => { setSelectedPortal('siswa'); setLoginError(''); setLoginIdentifier(''); }}
                className="w-full bg-slate-900 hover:bg-indigo-950/60 border border-slate-700 hover:border-indigo-500/50 p-4 rounded-2xl transition group flex items-center gap-4 text-left shadow transform hover:-translate-y-0.5 duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center transition border border-indigo-500/30">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition">Portal Siswa</h3>
                  <p className="text-xs text-slate-400">Masuk menggunakan Nomor NISN terdaftar</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedPortal('admin'); setLoginError(''); setLoginIdentifier(''); setLoginPassword(''); }}
                className="w-full bg-slate-900 hover:bg-slate-700/60 border border-slate-700 p-4 rounded-2xl transition group flex items-center gap-4 text-left shadow transform hover:-translate-y-0.5 duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-slate-600 text-slate-300 group-hover:text-white flex items-center justify-center transition border border-slate-600/50">
                  <ShieldCheck className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition">Portal Admin / Guru</h3>
                  <p className="text-xs text-slate-400">Dashboard kelola siswa & moderasi pesan</p>
                </div>
              </button>
            </div>
          )}

          {selectedPortal === 'siswa' && (
            <div className="space-y-4 pt-2 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <button
                  onClick={() => { setSelectedPortal(null); setLoginError(''); }}
                  className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" /> Portal Siswa
                </span>
              </div>

              {loginError && (
                <div className="bg-rose-950/60 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleSiswaLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor NISN Siswa</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Masukkan NISN Siswa..."
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      autoFocus
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">Gunakan NISN resmi yang sudah terdaftar di sekolah.</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2"
                >
                  Masuk Portal Siswa
                </button>
              </form>
            </div>
          )}

          {selectedPortal === 'admin' && (
            <div className="space-y-4 pt-2 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <button
                  onClick={() => { setSelectedPortal(null); setLoginError(''); }}
                  className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Portal Admin
                </span>
              </div>

              {loginError && (
                <div className="bg-rose-950/60 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Username Admin</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Username Admin"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      autoFocus
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password Admin</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="password"
                      placeholder="Password Admin"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2"
                >
                  Masuk Dashboard Admin
                </button>
              </form>
            </div>
          )}

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">💡 Akses Uji Coba (Demo):</p>
            <p>• <b>Login Admin:</b> User: <code className="text-indigo-300">admin</code> | Pass: <code className="text-indigo-300">admin123</code></p>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // APP VIEW 2: MAIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12 relative">
      
      {/* REACT BITS STYLE SWIPEABLE TOAST NOTIFICATION (DI DASHBOARD UTAMA) */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform translate-y-0 opacity-100 animate-slideDown">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md text-xs font-medium cursor-pointer ${
            toast.type === 'error' ? 'bg-rose-950/80 border-rose-800 text-rose-200' :
            toast.type === 'info' ? 'bg-slate-800/90 border-slate-700 text-slate-200' :
            'bg-slate-900/90 border-indigo-500/40 text-indigo-200 shadow-indigo-500/10'
          }`} onClick={() => setToast(prev => ({ ...prev, show: false }))}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              toast.type === 'error' ? 'bg-rose-500' :
              toast.type === 'info' ? 'bg-slate-400' : 'bg-indigo-400'
            }`} />
            <span>{toast.message}</span>
            <span className="text-[10px] text-slate-400 ml-2 border-l border-slate-700 pl-2">Klik untuk tutup</span>
          </div>
        </div>
      )}

      {/* Navbar Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-2xl flex items-center justify-center shadow-md bg-transparent">
              <img src="/logo.png" alt="Logo YP17" className="h-10 w-auto object-contain rounded-xl" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-indigo-400">Schoolfess SMA YP17</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded-full bg-slate-700 font-semibold text-slate-200 uppercase text-[10px]">
                  {currentUser.role}
                </span>
                <span>{currentUser.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <nav className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 gap-1">
              <button 
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'feed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Feed Menfess
              </button>
              
              <button 
                onClick={() => setActiveTab('post')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'post' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Kirim Menfess
              </button>

              {currentUser.role === 'admin' && (
                <button 
                  onClick={() => setActiveTab('database')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${activeTab === 'database' ? 'bg-indigo-600 text-white shadow' : 'text-indigo-400 hover:text-white'}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Data Siswa
                </button>
              )}
            </nav>

            <button
              onClick={handleLogout}
              title="Logout"
              className="bg-slate-900 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 p-2 rounded-xl border border-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 mt-6">
        
        {/* TAB 1: FEED MENFESS */}
        {activeTab === 'feed' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Cari pesan, penerima, atau pengirim..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['All', '#Crush', '#Curhat', '#Salam', '#Random', '#Tanya'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <p className="text-slate-400 text-sm animate-pulse">Menghubungkan ke database Supabase...</p>
                </div>
              ) : filteredMenfess.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <p className="text-slate-400 text-sm">Belum ada menfess ditemukan di Supabase.</p>
                </div>
              ) : (
                filteredMenfess.map((item) => {
                  const hasLiked = (item.liked_by || []).includes(currentUser?.nisn || currentUser?.name);

                  return (
                    <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md space-y-3 relative">
                      
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                            {(item.sender || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-200">{item.sender}</h3>
                            <p className="text-xs text-indigo-400">Ke: @{item.recipient}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-medium">
                            {item.category}
                          </span>

                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => triggerConfirmModal('Hapus Menfess', 'Yakin ingin menghapus menfess ini secara permanen?', 'DELETE_MENFESS', item.id)}
                              title="Hapus Menfess (Admin)"
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{item.text}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
                        <span>{formatTimestamp(item.created_at)}</span>
                        <button 
                          onClick={() => handleLike(item)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition border ${hasLiked ? 'bg-rose-950/50 border-rose-800/80 text-rose-300' : 'bg-slate-900 hover:bg-slate-700 text-rose-400 border-slate-700'}`}
                          title={hasLiked ? 'Kamu sudah menyukai ini' : 'Sukai menfess ini'}
                        >
                          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-rose-500'}`} />
                          <span className="font-semibold">{item.likes || 0}</span>
                        </button>
                      </div>

                      {/* Section Komentar */}
                      <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
                        {(item.comments || []).map((comm, idx) => (
                          <div key={comm.id || idx} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50 text-xs animate-fadeIn">
                            <span className="font-semibold text-indigo-300">{comm.author}: </span>
                            <span className="text-slate-300">{comm.text}</span>
                          </div>
                        ))}

                        <div className="flex gap-2 pt-1">
                          <input 
                            type="text"
                            placeholder="Tulis balasan..."
                            value={commentInputs[item.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          />
                          <button 
                            onClick={() => handleAddComment(item)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow"
                          >
                            Kirim
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: KIRIM MENFESS */}
        {activeTab === 'post' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-md animate-fadeIn">
            <h2 className="text-lg font-bold text-slate-100 mb-1">Kirim Menfess Baru</h2>
            <p className="text-xs text-slate-400 mb-6">Pesanmu bakal tampil di feed secara publik. Jaga kesopanan ya!</p>

            <form onSubmit={handleSendMenfess} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pengirim</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Anonim / Cowok XII IPA 1"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Untuk Penerima <span className="text-slate-500 font-normal">(Opsional)</span></label>
                  <input 
                    type="text" 
                    placeholder="Bebas / Kosongkan untuk umum"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kategori Pesan</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="#Crush">#Crush (Suka seseorang)</option>
                  <option value="#Curhat">#Curhat (Keluh kesah sekolah)</option>
                  <option value="#Salam">#Salam (Salam kenal / persahabatan)</option>
                  <option value="#Random">#Random (Bebas)</option>
                  <option value="#Tanya">#Tanya (Bertanya info sekolah)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Isi Pesan Menfess *</label>
                <textarea 
                  rows="4"
                  placeholder="Tulis pesanmu di sini..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Kirim Menfess Sekarang
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: DASHBOARD DATABASE SISWA (ADMIN CRUD) */}
        {activeTab === 'database' && currentUser.role === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md">
              <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" /> Tambah Data Siswa Baru (Supabase CRUD)
              </h3>
              <form onSubmit={handleAddStudentSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input 
                  type="text"
                  placeholder="Nomor NISN"
                  value={newNisn}
                  onChange={(e) => setNewNisn(e.target.value)}
                  required
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <input 
                  type="text"
                  placeholder="Nama Lengkap Siswa"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <select 
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </select>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold py-2 transition shadow flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Simpan Siswa
                </button>
              </form>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" /> Direktori Data Siswa SMA YP17
                  </h3>
                  <p className="text-xs text-slate-400">Total terdaftar: {students.length} siswa</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 text-slate-400 w-3.5 h-3.5" />
                  <input 
                    type="text"
                    placeholder="Cari NISN, Nama, atau Kelas..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">NISN</th>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-slate-400">Siswa tidak ditemukan.</td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.nisn} className="hover:bg-slate-700/30 transition">
                          <td className="py-3 px-4 font-mono text-indigo-300">{s.nisn}</td>
                          <td className="py-3 px-4 font-medium text-slate-200">{s.name}</td>
                          <td className="py-3 px-4 text-slate-300">{s.class}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => { setEditingStudent(s); setEditName(s.name); setEditClass(s.class || 'X'); }}
                                className="text-slate-400 hover:text-indigo-400 transition p-1"
                                title="Edit Data Siswa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => triggerConfirmModal('Hapus Siswa', `Hapus data siswa ${s.name} (${s.nisn}) dari sistem?`, 'DELETE_STUDENT', s.nisn)}
                                className="text-slate-400 hover:text-rose-400 transition p-1"
                                title="Hapus Data Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* MODAL EDIT DATA SISWA */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 transform transition-all animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Data Siswa
              </h3>
              <button 
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">NISN (Primary Key)</label>
                <input 
                  type="text" 
                  value={editingStudent.nisn} 
                  disabled 
                  className="w-full bg-slate-950 border border-slate-800 text-slate-500 rounded-xl px-3 py-2 text-xs font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap Siswa</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  required 
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kelas</label>
                <select 
                  value={editClass} 
                  onChange={(e) => setEditClass(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow"
                >
                  <Check className="w-4 h-4" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI INTERAKTIF ADMIN (ANIMATED) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center transform transition-all animate-scaleUp">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-base">{confirmModal.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', actionType: null, payload: null })}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" /> Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}