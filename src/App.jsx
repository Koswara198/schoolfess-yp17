import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, Heart, Send, Search, Users, Database, 
  ShieldCheck, UserPlus, Trash2, LogOut, Lock, User, Key, AlertCircle, Edit3, X, Check, ArrowLeft, GraduationCap, AlertTriangle, Sparkles 
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
  const [sender, setSender] = useState('Anonim');
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

  // Handler Login Admin & Guru
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    const inputUser = loginIdentifier.trim();
    const inputPass = loginPassword;

    // === CEK ADMIN ===
    if (
      inputUser === import.meta.env.VITE_ADMIN_USER &&
      inputPass === import.meta.env.VITE_ADMIN_PASS
    ) {
      const user = { role: 'admin', name: 'Administrator YP17', nisn: 'admin_yp17' };
      setCurrentUser(user);
      setActiveTab('database');
      showToast('Berhasil masuk sebagai Admin YP17 🛡️', 'success');
      return;
    }

    // === CEK GURU ===
    const teachers = [
      {
        user: import.meta.env.VITE_TEACHER_USER_1,
        pass: import.meta.env.VITE_TEACHER_PASS_1,
        name: import.meta.env.VITE_TEACHER_NAME_1,
      },
      {
        user: import.meta.env.VITE_TEACHER_USER_2,
        pass: import.meta.env.VITE_TEACHER_PASS_2,
        name: import.meta.env.VITE_TEACHER_NAME_2,
      },
      {
        user: import.meta.env.VITE_TEACHER_USER_3,
        pass: import.meta.env.VITE_TEACHER_PASS_3,
        name: import.meta.env.VITE_TEACHER_NAME_3,
      },
    ];

    const matchedTeacher = teachers.find(
      (t) => t.user && inputUser === t.user && inputPass === t.pass
    );

    if (matchedTeacher) {
      const user = { role: 'guru', name: matchedTeacher.name, nisn: `guru_${matchedTeacher.user}` };
      setCurrentUser(user);
      setActiveTab('feed'); // guru langsung ke feed
      showToast(`Berhasil masuk sebagai Guru: ${matchedTeacher.name} 👨‍🏫`, 'success');
      return;
    }

    setLoginError('Username atau Password salah!');
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

  // Handler Kirim Menfess
  const handleSendMenfess = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      showToast('Isi pesan menfess wajib diisi!', 'error');
      return;
    }

    const newPost = {
      sender: sender.trim() || 'Anonim',
      recipient: recipient.trim() || 'Semua Warga YP17',
      category,
      text: text.trim(),
      likes: 0,
      liked_by: [],
      comments: []
    };

    const { error } = await supabase.from('menfess').insert([newPost]);

    if (error) {
      showToast('Gagal mengirim menfess: ' + error.message, 'error');
    } else {
      setText('');
      setRecipient('');
      setSender('Anonim');
      await fetchMenfess();
      showToast('✨ Menfess terpublikasi ke feed!', 'success');
      setActiveTab('feed');
    }
  };

  // Handler Like (1 Akun = 1 Like)
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

  // Handler Komentar
  const handleAddComment = async (item) => {
    const commentText = commentInputs[item.id];
    if (!commentText || !commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      author: currentUser?.role === 'admin' ? 'Admin YP17' : currentUser?.role === 'guru' ? currentUser?.name : currentUser?.name || 'Siswa YP17',
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

  // ADMIN MODAL CONFIRMATION EXECUTOR
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
        showToast('Menfess berhasil dihapus.', 'info');
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
  // APP VIEW 1: LOGIN PORTAL (EMAS & MERAH YP17)
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        
        {/* Glow Background Akses Logo Emas-Merah */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-amber-500/10 via-rose-600/15 to-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* SWIPEABLE TOAST NOTIFICATION (REACT BITS STYLE) */}
        {toast.show && (
          <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform translate-y-0 opacity-100 animate-slideDown">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md text-xs font-medium cursor-pointer ${
              toast.type === 'error' ? 'bg-rose-950/90 border-rose-800/80 text-rose-200 shadow-rose-900/20' :
              toast.type === 'info' ? 'bg-slate-900/90 border-amber-500/30 text-amber-200 shadow-amber-500/10' :
              'bg-slate-900/95 border-amber-500/50 text-amber-100 shadow-amber-500/20'
            }`} onClick={() => setToast(prev => ({ ...prev, show: false }))}>
              <div className={`w-2.5 h-2.5 rounded-full animate-ping ${
                toast.type === 'error' ? 'bg-rose-500' :
                toast.type === 'info' ? 'bg-amber-400' : 'bg-amber-400'
              }`} />
              <span>{toast.message}</span>
              <span className="text-[10px] text-amber-400/60 ml-2 border-l border-amber-500/20 pl-2">Tutup</span>
            </div>
          </div>
        )}

        <div className="bg-slate-900/80 border border-amber-500/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-amber-500/5 space-y-6 relative z-10">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-1.5 rounded-2xl shadow-xl mb-1 bg-gradient-to-b from-amber-500/20 to-rose-600/20 border border-amber-500/30">
              <img src="/logo.png" alt="Logo YP17" className="h-16 w-auto object-contain rounded-xl" />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-amber-300 via-amber-100 to-rose-400 bg-clip-text text-transparent tracking-wide">
              Schoolfess SMA YP17
            </h1>
            <p className="text-xs text-amber-200/60 font-medium">PRO PATRIA — Platform Aspirasi & Menfess Resmi</p>
          </div>

          {selectedPortal === null && (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-center text-amber-100/70 font-semibold uppercase tracking-wider">Pilih Portal Akses:</p>
              
              <button
                type="button"
                onClick={() => { setSelectedPortal('siswa'); setLoginError(''); setLoginIdentifier(''); }}
                className="w-full bg-slate-900/80 hover:bg-amber-950/40 border border-amber-500/30 hover:border-amber-400/60 p-4 rounded-2xl transition-all duration-300 group flex items-center gap-4 text-left shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 group-hover:from-amber-400 group-hover:to-rose-500 text-slate-950 flex items-center justify-center transition shadow-md shadow-amber-500/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-100 group-hover:text-amber-300 transition">Portal Siswa</h3>
                  <p className="text-xs text-slate-400">Masuk menggunakan Nomor NISN resmi</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedPortal('admin'); setLoginError(''); setLoginIdentifier(''); setLoginPassword(''); }}
                className="w-full bg-slate-900/80 hover:bg-rose-950/30 border border-rose-900/40 hover:border-rose-500/50 p-4 rounded-2xl transition-all duration-300 group flex items-center gap-4 text-left shadow-lg hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-amber-500/30 group-hover:border-amber-400 text-amber-400 flex items-center justify-center transition">
                  <ShieldCheck className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-amber-300 transition">Portal Admin / Guru</h3>
                  <p className="text-xs text-slate-400">Dashboard moderasi & kelola database</p>
                </div>
              </button>
            </div>
          )}

          {selectedPortal === 'siswa' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <button
                  onClick={() => { setSelectedPortal(null); setLoginError(''); }}
                  className="text-amber-200/60 hover:text-amber-200 text-xs flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" /> Portal Siswa
                </span>
              </div>

              {loginError && (
                <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleSiswaLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-200/80 mb-1">Nomor NISN Siswa</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-amber-500/60 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Masukkan NISN Siswa..."
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      autoFocus
                      className="w-full bg-slate-950 border border-amber-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 text-slate-200"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Gunakan NISN resmi yang sudah terdaftar di database YP17.</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-extrabold py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  Masuk Portal Siswa
                </button>
              </form>
            </div>
          )}

          {selectedPortal === 'admin' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <button
                  onClick={() => { setSelectedPortal(null); setLoginError(''); }}
                  className="text-amber-200/60 hover:text-amber-200 text-xs flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Portal Admin / Guru
                </span>
              </div>

              {loginError && (
                <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-200/80 mb-1">Username Admin / Guru</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-amber-500/60 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Username Admin / Guru"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      autoFocus
                      className="w-full bg-slate-950 border border-amber-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200/80 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-amber-500/60 w-4 h-4" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-amber-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 text-slate-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-sm transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
                >
                  Masuk Dashboard
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ==========================================
  // APP VIEW 2: MAIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 relative">
      
      {/* REACT BITS STYLE SWIPEABLE TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 transition-all duration-300 transform translate-y-0 opacity-100">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md text-xs font-medium cursor-pointer ${
            toast.type === 'error' ? 'bg-rose-950/90 border-rose-800 text-rose-200' :
            toast.type === 'info' ? 'bg-slate-900/90 border-amber-500/30 text-amber-200' :
            'bg-slate-900/95 border-amber-500/50 text-amber-100 shadow-amber-500/10'
          }`} onClick={() => setToast(prev => ({ ...prev, show: false }))}>
            <div className={`w-2.5 h-2.5 rounded-full animate-ping ${
              toast.type === 'error' ? 'bg-rose-500' : 'bg-amber-400'
            }`} />
            <span>{toast.message}</span>
            <span className="text-[10px] text-amber-400/60 ml-2 border-l border-amber-500/20 pl-2">Tutup</span>
          </div>
        </div>
      )}

      {/* Navbar Header (Warna Emas-Merah YP17) */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-amber-500/20 sticky top-0 z-40 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-gradient-to-b from-amber-500/20 to-rose-600/20 border border-amber-500/30">
              <img src="/logo.png" alt="Logo YP17" className="h-9 w-auto object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="font-extrabold text-base bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                Schoolfess SMA YP17
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-amber-200/60">
                <span className={`px-2 py-0.5 rounded-full border font-bold uppercase text-[9px] ${
                  currentUser.role === 'admin'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800/50'
                    : currentUser.role === 'guru'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/50'
                    : 'bg-slate-800 text-slate-300 border-slate-600'
                  }`}>
                  {currentUser.role}
                </span>
                <span>{currentUser.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <nav className="flex bg-slate-950 p-1 rounded-xl border border-amber-500/20 gap-1">
              <button 
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'feed' ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 shadow-md shadow-amber-500/20' : 'text-amber-200/60 hover:text-amber-100'}`}
              >
                Feed Menfess
              </button>
              
              <button 
                onClick={() => setActiveTab('post')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'post' ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 shadow-md shadow-amber-500/20' : 'text-amber-200/60 hover:text-amber-100'}`}
              >
                Kirim Menfess
              </button>

              {currentUser.role === 'admin' && (
                <button 
                  onClick={() => setActiveTab('database')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${activeTab === 'database' ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 shadow-md shadow-amber-500/20' : 'text-rose-400 hover:text-amber-200'}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Data Siswa
                </button>
              )}
            </nav>

            <button
              onClick={handleLogout}
              title="Logout"
              className="bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 p-2 rounded-xl border border-amber-500/20 transition"
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
          <div className="space-y-4">
            
            {/* Search & Filter Bar */}
            <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20 flex flex-col gap-3 shadow-lg">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-amber-500/50 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Cari pesan, penerima, atau pengirim..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 text-slate-200"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['All', '#Crush', '#Curhat', '#Salam', '#Random', '#Tanya'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${selectedCategory === cat ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-950 text-amber-200/60 border border-amber-500/20 hover:bg-slate-800'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List Menfess */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-amber-500/20">
                  <p className="text-amber-200/60 text-sm animate-pulse">Memuat data dari database Supabase...</p>
                </div>
              ) : filteredMenfess.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-amber-500/20">
                  <p className="text-amber-200/60 text-sm">Belum ada menfess ditemukan di Supabase.</p>
                </div>
              ) : (
                filteredMenfess.map((item) => {
                  const hasLiked = (item.liked_by || []).includes(currentUser?.nisn || currentUser?.name);

                  return (
                    <div key={item.id} className="bg-slate-900/80 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 shadow-lg hover:border-amber-500/40 transition-all duration-300 space-y-3 relative">
                      
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-slate-950 flex items-center justify-center font-extrabold text-xs shadow-md">
                            {(item.sender || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-200">{item.sender}</h3>
                            <p className="text-xs text-amber-400 font-medium">Ke: @{item.recipient}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                            {item.category}
                          </span>

                          {/* Tombol Hapus untuk Admin & Guru */}
                          {(currentUser.role === 'admin' || currentUser.role === 'guru') && (
                            <button
                              onClick={() => triggerConfirmModal('Hapus Menfess', 'Yakin ingin menghapus menfess ini secara permanen?', 'DELETE_MENFESS', item.id)}
                              title="Hapus Menfess"
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{item.text}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-amber-500/15 text-xs text-amber-200/60">
                        <span>{formatTimestamp(item.created_at)}</span>
                        <button 
                          onClick={() => handleLike(item)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition border ${hasLiked ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-slate-950 hover:bg-slate-800 text-rose-400 border-amber-500/20'}`}
                          title={hasLiked ? 'Kamu sudah menyukai ini' : 'Sukai menfess ini'}
                        >
                          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-rose-500'}`} />
                          <span className="font-semibold">{item.likes || 0}</span>
                        </button>
                      </div>

                      {/* Section Komentar */}
                      <div className="mt-3 pt-3 border-t border-amber-500/15 space-y-2">
                        {(item.comments || []).map((comm, idx) => (
                          <div key={comm.id || idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-500/10 text-xs">
                            <span className="font-bold text-amber-300">{comm.author}: </span>
                            <span className="text-slate-300">{comm.text}</span>
                          </div>
                        ))}

                        <div className="flex gap-2 pt-1">
                          <input 
                            type="text"
                            placeholder="Tulis balasan..."
                            value={commentInputs[item.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                            className="flex-1 bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                          />
                          <button 
                            onClick={() => handleAddComment(item)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/10"
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
          <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-amber-300 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Kirim Menfess Baru
            </h2>
            <p className="text-xs text-amber-200/60 mb-6">Pesanmu bakal tampil di feed secara publik. Jaga kesopanan ya!</p>

            <form onSubmit={handleSendMenfess} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-200/80 mb-1">Pengirim</label>
                  <input 
                  type="text" 
                  placeholder="Anonim"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  disabled={currentUser.role !== 'admin'}
                  className={`w-full bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400 ${
                    currentUser.role !== 'admin' ? 'text-slate-500 cursor-not-allowed' : 'text-slate-200'
                  }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-200/80 mb-1">Untuk Penerima <span className="text-slate-500 font-normal">(Opsional)</span></label>
                  <input 
                    type="text" 
                    placeholder="Bebas / Kosongkan untuk umum"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200/80 mb-1">Kategori Pesan</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="#Crush">#Crush (Suka seseorang)</option>
                  <option value="#Curhat">#Curhat (Keluh kesah sekolah)</option>
                  <option value="#Salam">#Salam (Salam kenal / persahabatan)</option>
                  <option value="#Random">#Random (Bebas)</option>
                  <option value="#Tanya">#Tanya (Bertanya info sekolah)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200/80 mb-1">Isi Pesan Menfess *</label>
                <textarea 
                  rows="4"
                  placeholder="Tulis pesanmu di sini..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-amber-500/20 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-extrabold py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Kirim Menfess Sekarang
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: DASHBOARD DATABASE SISWA (ADMIN CRUD) */}
        {activeTab === 'database' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" /> Tambah Data Siswa Baru (Supabase CRUD)
              </h3>
              <form onSubmit={handleAddStudentSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input 
                  type="text"
                  placeholder="Nomor NISN"
                  value={newNisn}
                  onChange={(e) => setNewNisn(e.target.value)}
                  required
                  className="bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
                <input 
                  type="text"
                  placeholder="Nama Lengkap Siswa"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
                <select 
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  className="bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </select>
                <button 
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold py-2 transition shadow-md flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Simpan Siswa
                </button>
              </form>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" /> Direktori Data Siswa SMA YP17
                  </h3>
                  <p className="text-xs text-amber-200/60">Total terdaftar: {students.length} siswa</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 text-amber-500/50 w-3.5 h-3.5" />
                  <input 
                    type="text"
                    placeholder="Cari NISN, Nama, atau Kelas..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-amber-300/80 uppercase font-bold tracking-wider border-b border-amber-500/20">
                    <tr>
                      <th className="py-3 px-4">NISN</th>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4 text-center">Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-amber-200/60">Siswa tidak ditemukan.</td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.nisn} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono text-amber-300">{s.nisn}</td>
                          <td className="py-3 px-4 font-medium text-slate-200">{s.name}</td>
                          <td className="py-3 px-4 text-amber-200/80">{s.class}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => { setEditingStudent(s); setEditName(s.name); setEditClass(s.class || 'X'); }}
                                className="text-slate-400 hover:text-amber-300 transition p-1"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-amber-500/20 pb-3">
              <h3 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <Edit3 className="w-4 h-4 text-amber-400" /> Edit Data Siswa
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
                <label className="block text-xs font-semibold text-amber-200/60 mb-1">NISN (Primary Key)</label>
                <input 
                  type="text" 
                  value={editingStudent.nisn} 
                  disabled 
                  className="w-full bg-slate-950 border border-slate-800 text-slate-500 rounded-xl px-3 py-2 text-xs font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200/80 mb-1">Nama Lengkap Siswa</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  required 
                  className="w-full bg-slate-950 border border-amber-500/30 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200/80 mb-1">Kelas</label>
                <select 
                  value={editClass} 
                  onChange={(e) => setEditClass(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/30 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
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
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-xl text-xs transition border border-amber-500/20"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-md shadow-amber-500/10"
                >
                  <Check className="w-4 h-4" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI INTERAKTIF ADMIN */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-amber-300 text-base">{confirmModal.title}</h3>
              <p className="text-xs text-amber-100/70 leading-relaxed">{confirmModal.message}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', actionType: null, payload: null })}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs transition border border-amber-500/20"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="flex-1 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1"
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