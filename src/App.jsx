import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, Heart, Send, Search, Users, Database, 
  ShieldCheck, UserPlus, Trash2, LogOut, Lock, User, Key, AlertCircle 
} from 'lucide-react';

export default function SchoolfessApp() {
  // State Sesi User: null (Belum login), { role: 'siswa', name: '...', nisn: '...' }, atau { role: 'admin', name: 'Admin YP17' }
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('yp17_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('feed');

  // Form Login State
  const [loginRole, setLoginRole] = useState('siswa'); // 'siswa' atau 'admin'
  const [loginIdentifier, setLoginIdentifier] = useState(''); // NISN / Username
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Initial Menfess Data
  const [menfessList, setMenfessList] = useState(() => {
    const saved = localStorage.getItem('yp17_menfess');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        sender: 'Anonim',
        recipient: 'Anak IPS 2',
        category: '#Crush',
        text: 'Halo yang duduk di barisan kedua dekat jendela IPS 2, senyummu bikin adem pas upacara tadi wkwk.',
        likes: 12,
        timestamp: '10 menit lalu',
        comments: [
          { id: 1, author: 'Rizky (XII IPA 1)', text: 'Wah spill orangnya bro!' }
        ]
      },
      {
        id: 2,
        sender: 'Si Paling Piket',
        recipient: 'Pengurus Kelas XI',
        category: '#Curhat',
        text: 'Tolong dong kalau piket kelas jangan cuma coret-coret papan tulis doang, sapunya juga dipakai 😭',
        likes: 25,
        timestamp: '1 jam lalu',
        comments: []
      }
    ];
  });

  // Initial Student Database
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('yp17_students');
    return saved ? JSON.parse(saved) : [
      { nisn: '0071234561', name: 'Rizky Pratama', class: 'XII IPA 1', status: 'Aktif' },
      { nisn: '0071234562', name: 'Siti Aisyah', class: 'XII IPS 2', status: 'Aktif' },
      { nisn: '0082345671', name: 'Dimas Anggara', class: 'XI IPA 2', status: 'Aktif' },
      { nisn: '0082345672', name: 'Dewi Lestari', class: 'X IPS 1', status: 'Aktif' },
    ];
  });

  // Form Menfess State
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState('#Crush');
  const [text, setText] = useState('');

  // Form Tambah Siswa (Admin)
  const [newNisn, setNewNisn] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('X IPA 1');

  // Search & Filter
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('yp17_menfess', JSON.stringify(menfessList));
  }, [menfessList]);

  useEffect(() => {
    localStorage.setItem('yp17_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('yp17_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('yp17_session');
    }
  }, [currentUser]);

  // Handler Login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginRole === 'admin') {
      if (loginIdentifier === 'admin' && loginPassword === 'admin123') {
        const user = { role: 'admin', name: 'Administrator YP17' };
        setCurrentUser(user);
        setActiveTab('database');
      } else {
        setLoginError('Username atau Password Admin salah! (Default: admin / admin123)');
      }
    } else {
      // Login Siswa pakai NISN
      const foundStudent = students.find(s => s.nisn === loginIdentifier.trim());
      if (foundStudent) {
        const user = { role: 'siswa', name: foundStudent.name, nisn: foundStudent.nisn, class: foundStudent.class };
        setCurrentUser(user);
        setActiveTab('feed');
      } else {
        setLoginError('NISN tidak terdaftar di database SMA YP17! Hubungi Admin.');
      }
    }
  };

  // Handler Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setLoginIdentifier('');
    setLoginPassword('');
    setLoginError('');
  };

  // Handler Kirim Menfess
  const handleSendMenfess = (e) => {
    e.preventDefault();
    if (!text.trim() || !recipient.trim()) {
      alert('Pesan dan Penerima wajib diisi!');
      return;
    }

    const newPost = {
      id: Date.now(),
      sender: sender.trim() || currentUser?.name || 'Anonim',
      recipient: recipient.trim(),
      category,
      text: text.trim(),
      likes: 0,
      timestamp: 'Baru saja',
      comments: []
    };

    setMenfessList([newPost, ...menfessList]);
    setText('');
    setRecipient('');
    setSender('');
    setActiveTab('feed');
  };

  // Handler Like
  const handleLike = (id) => {
    setMenfessList(menfessList.map(item => 
      item.id === id ? { ...item, likes: item.likes + 1 } : item
    ));
  };

  // Handler Hapus Menfess (Admin)
  const handleDeleteMenfess = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus menfess ini?')) {
      setMenfessList(menfessList.filter(item => item.id !== id));
    }
  };

  // Handler Komentar
  const handleAddComment = (id) => {
    const commentText = commentInputs[id];
    if (!commentText || !commentText.trim()) return;

    setMenfessList(menfessList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          comments: [...item.comments, { 
            id: Date.now(), 
            author: currentUser?.role === 'admin' ? 'Admin YP17' : currentUser?.name || 'Siswa YP17', 
            text: commentText.trim() 
          }]
        };
      }
      return item;
    }));

    setCommentInputs({ ...commentInputs, [id]: '' });
  };

  // Handler Tambah Siswa (Admin)
  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newNisn || !newName) {
      alert('NISN dan Nama lengkap wajib diisi!');
      return;
    }
    if (students.some(s => s.nisn === newNisn)) {
      alert('NISN sudah terdaftar!');
      return;
    }

    setStudents([...students, { nisn: newNisn, name: newName, class: newClass, status: 'Aktif' }]);
    setNewNisn('');
    setNewName('');
    alert('Data siswa berhasil ditambahkan!');
  };

  // Handler Hapus Siswa (Admin)
  const handleDeleteStudent = (nisn) => {
    if (window.confirm(`Hapus data siswa dengan NISN ${nisn}?`)) {
      setStudents(students.filter(s => s.nisn !== nisn));
    }
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
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.nisn.includes(studentSearch) ||
    s.class.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // APP VIEW 1: JIKA BELUM LOGIN (TAMPILKAN HALAMAN LOGIN)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
          
          {/* Header Portal Login */}
          <div className="text-center space-y-2">
            <div className="inline-flex bg-indigo-600 text-white p-3 rounded-2xl font-bold text-2xl shadow-lg mb-1">
              YP17
            </div>
            <h1 className="text-2xl font-extrabold text-white">Schoolfess SMA YP17</h1>
            <p className="text-xs text-slate-400">Silakan login untuk mengakses platform aspirasi sekolah</p>
          </div>

          {/* Switch Tab Role (Siswa / Admin) */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-700">
            <button
              type="button"
              onClick={() => { setLoginRole('siswa'); setLoginError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${loginRole === 'siswa' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Portal Siswa
            </button>
            <button
              type="button"
              onClick={() => { setLoginRole('admin'); setLoginError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${loginRole === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Portal Admin / Guru
            </button>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="bg-rose-950/60 border border-rose-800/80 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginRole === 'siswa' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Masukkan Nomor NISN Siswa</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Contoh: 0071234561"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Gunakan NISN yang sudah terdaftar di data sekolah.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Username Admin</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Username (admin)"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password Admin</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="password"
                      placeholder="Password (admin123)"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg mt-2"
            >
              {loginRole === 'siswa' ? 'Masuk sebagai Siswa' : 'Masuk Dashboard Admin'}
            </button>
          </form>

          {/* Quick Demo Info */}
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">💡 Akses Uji Coba (Demo):</p>
            <p>• <b>NISN Siswa Demo:</b> <code className="text-indigo-300">0071234561</code> (Rizky Pratama)</p>
            <p>• <b>Login Admin:</b> User: <code className="text-indigo-300">admin</code> | Pass: <code className="text-indigo-300">admin123</code></p>
          </div>

        </div>
      </div>
    );
  }

  // APP VIEW 2: SETELAH LOGIN (UTAMA)
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12">
      
      {/* Navbar Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold text-lg">YP17</div>
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
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <nav className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 gap-1">
              <button 
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'feed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Feed Menfess
              </button>
              
              {/* Siswa & Admin Boleh Kirim Menfess */}
              <button 
                onClick={() => setActiveTab('post')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'post' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Kirim Menfess
              </button>

              {/* HANYA ADMIN YANG BISA LIHAT TAB DATABASE SISWA */}
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
          <div className="space-y-4">
            
            {/* Search & Filter Bar */}
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

            {/* List Menfess */}
            <div className="space-y-4">
              {filteredMenfess.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <p className="text-slate-400 text-sm">Belum ada menfess ditemukan.</p>
                </div>
              ) : (
                filteredMenfess.map((item) => (
                  <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md space-y-3 relative">
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                          {item.sender.charAt(0).toUpperCase()}
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

                        {/* FITUR MODERASI HANYA UNTUK ADMIN */}
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteMenfess(item.id)}
                            title="Hapus Menfess (Fitur Admin)"
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{item.text}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
                      <span>{item.timestamp}</span>
                      <button 
                        onClick={() => handleLike(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-rose-400 transition border border-slate-700"
                      >
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                        <span className="font-semibold">{item.likes}</span>
                      </button>
                    </div>

                    {/* Section Komentar */}
                    <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
                      {item.comments.map((comm) => (
                        <div key={comm.id} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                          <span className="font-semibold text-indigo-300">{comm.author}: </span>
                          <span className="text-slate-300">{comm.text}</span>
                        </div>
                      ))}

                      {/* Input Balasan Komentar */}
                      <div className="flex gap-2 pt-1">
                        <input 
                          type="text"
                          placeholder="Tulis balasan..."
                          value={commentInputs[item.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                        <button 
                          onClick={() => handleAddComment(item.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                        >
                          Kirim
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: KIRIM MENFESS */}
        {activeTab === 'post' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-md">
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Untuk Penerima *</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: @Anak_Paskibra / Siti IPS 2"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
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

        {/* TAB 3: DASHBOARD DATABASE SISWA (KHUSUS ADMIN) */}
        {activeTab === 'database' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            
            {/* Box Admin Pendaftaran Siswa Baru */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-md">
              <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" /> Daftarkan / Tambah Data Siswa Baru
              </h3>
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input 
                  type="text"
                  placeholder="Nomor NISN"
                  value={newNisn}
                  onChange={(e) => setNewNisn(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <input 
                  type="text"
                  placeholder="Nama Lengkap Siswa"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <select 
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="X IPA 1">X IPA 1</option>
                  <option value="X IPS 1">X IPS 1</option>
                  <option value="XI IPA 2">XI IPA 2</option>
                  <option value="XI IPS 2">XI IPS 2</option>
                  <option value="XII IPA 1">XII IPA 1</option>
                  <option value="XII IPS 2">XII IPS 2</option>
                </select>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold py-2 transition shadow"
                >
                  Simpan Data
                </button>
              </form>
            </div>

            {/* List Tabel Data Siswa */}
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
                    placeholder="Cari NISN atau Nama..."
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
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-slate-400">Siswa tidak ditemukan.</td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.nisn} className="hover:bg-slate-700/30 transition">
                          <td className="py-3 px-4 font-mono text-indigo-300">{s.nisn}</td>
                          <td className="py-3 px-4 font-medium text-slate-200">{s.name}</td>
                          <td className="py-3 px-4 text-slate-300">{s.class}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-full font-medium">
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteStudent(s.nisn)}
                              className="text-slate-400 hover:text-rose-400 transition"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
    </div>
  );
}