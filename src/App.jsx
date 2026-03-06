import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  doc, 
  getDoc,
  deleteDoc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Package, 
  LogOut, 
  PlusCircle, 
  Phone, 
  Trash2, 
  ShieldCheck, 
  ShoppingBag, 
  Copy, 
  Search, 
  Filter, 
  MapPin, 
  Image as ImageIcon,
  Mail,
  ChevronRight,
  X
} from 'lucide-react';

/* --- FIRESTORE SECURITY RULES ---
  Copy and paste these into the "Rules" tab of your Firestore Console:

  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /artifacts/fila-market/public/data/products/{productId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow delete: if request.auth != null && 
          (get(/databases/$(database)/documents/artifacts/fila-market/users/$(request.auth.uid)).data.role == 'admin');
      }
      match /artifacts/fila-market/users/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
*/

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCi1eCrBtUvCVoyY9tX1gLiPeg2T5q7I-s",
  authDomain: "fila-market.firebaseapp.com",
  projectId: "fila-market",
  storageBucket: "fila-market.firebasestorage.app",
  messagingSenderId: "872863511065",
  appId: "1:872863511065:web:b16660bdd43abcb93af088",
  measurementId: "G-SDTER83330"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fila-market';

// --- DATA CONSTANTS ---
const CATEGORIES = {
  Clothing: ["Kids", "Sport", "Fashion"],
  Electronics: ["Earpad", "Cellphone", "Bureau Device", "Watch"],
  Machinery: ["Spare Parts", "Electromechanical"]
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState('home'); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [filters, setFilters] = useState({ category: '', niche: '', location: '', search: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          const newData = { email: currentUser.email, role: 'user' };
          await setDoc(userDocRef, newData);
          setUserData(newData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setProducts(items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => signOut(auth).then(() => setView('home'));

  const filteredProducts = products.filter(p => {
    return (
      (!filters.category || p.category === filters.category) &&
      (!filters.niche || p.niche === filters.niche) &&
      (!filters.location || p.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
      (!filters.search || p.name.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  if (loading) return <div className="h-screen flex items-center justify-center bg-blue-50 text-blue-600 font-bold">Initializing Store...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <ShoppingBag size={20} />
          </div>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hidden sm:block">
            FILA MARKET
          </h1>
        </div>

        <div className="flex gap-2 sm:gap-4 items-center">
          {user ? (
            <>
              {userData?.role === 'admin' && (
                <button onClick={() => setView('admin')} className="p-2 hover:bg-purple-50 rounded-xl text-purple-600 border border-transparent hover:border-purple-100 transition" title="Admin">
                  <ShieldCheck size={22} />
                </button>
              )}
              <button onClick={() => setView('post')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition active:scale-95">
                <PlusCircle size={18} /> <span className="hidden xs:block">Sell Item</span>
              </button>
              <button onClick={handleSignOut} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition" title="Logout">
                <LogOut size={22} />
              </button>
            </>
          ) : (
            <button onClick={() => setView('login')} className="bg-slate-100 text-slate-700 font-bold px-5 py-2 rounded-xl hover:bg-slate-200 transition">Login</button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {view === 'home' && (
          <HomeView 
            products={filteredProducts} 
            filters={filters} 
            setFilters={setFilters} 
          />
        )}
        {view === 'login' && <AuthForm type="login" setView={setView} />}
        {view === 'register' && <AuthForm type="register" setView={setView} />}
        {view === 'post' && <PostProductView user={user} setView={setView} />}
        {view === 'admin' && <AdminPanel products={products} userId={user?.uid} />}
      </main>
    </div>
  );
}

function HomeView({ products, filters, setFilters }) {
  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition" size={20} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500"
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value, niche: ''})}
          >
            <option value="">All Categories</option>
            {Object.keys(CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500"
            disabled={!filters.category}
            value={filters.niche}
            onChange={(e) => setFilters({...filters, niche: e.target.value})}
          >
            <option value="">All Niches</option>
            {filters.category && CATEGORIES[filters.category].map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Location..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className="aspect-square bg-slate-100 relative overflow-hidden group">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" onError={(e) => e.target.src = "https://placehold.co/400?text=No+Image"} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={64} /></div>
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm text-blue-600">
                  {product.category}
                </span>
                <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  {product.niche}
                </span>
              </div>
            </div>
            
            <div className="p-4 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 line-clamp-1">{product.name}</h3>
                <span className="text-blue-600 font-black text-lg">${product.price}</span>
              </div>
              
              <p className="text-slate-500 text-xs line-clamp-2 mb-4 flex-1">{product.description}</p>
              
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <MapPin size={14} className="text-red-400" /> 
                  <span className="truncate">{product.location || "Online"}</span>
                </div>
                
                <div className="flex gap-2">
                  <a href={`tel:${product.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition shadow-sm">
                    <Phone size={14} /> Call Now
                  </a>
                  {product.showEmail && (
                    <a href={`mailto:${product.sellerEmail}`} className="p-2 border rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-200 transition">
                      <Mail size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">No matching items</h3>
          <p className="text-slate-400 text-sm">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}

function AuthForm({ type, setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      if (type === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'users', res.user.uid), { email, role: 'user', createdAt: serverTimestamp() });
      }
      setView('home');
    } catch (err) { setError(err.message); }
  };

  const handleReset = async () => {
    if (!email) { setError("Enter email first to reset password"); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset email sent!");
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="max-w-md mx-auto mt-6 bg-white p-8 rounded-3xl shadow-2xl shadow-blue-100 border border-blue-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 z-0 opacity-50"></div>
      
      <div className="relative z-10">
        <h2 className="text-3xl font-black mb-2 text-slate-800 capitalize">{type}</h2>
        <p className="text-slate-500 text-sm mb-8">Access your personalized marketplace.</p>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-xs font-medium border border-red-100">{error}</div>}
        {msg && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-xs font-medium border border-green-100">{msg}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Email</label>
            <input 
              type="email" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-400 uppercase ml-1">Password</label>
            <input 
              type="password" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:shadow-lg hover:shadow-blue-200 transition active:scale-[0.98]">
            {type === 'login' ? 'Continue' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t flex flex-col gap-4 text-center">
          {type === 'login' && (
            <button onClick={handleReset} className="text-slate-400 text-sm hover:text-blue-600 transition font-medium">Forgot Password?</button>
          )}
          <p className="text-sm text-slate-500">
            {type === 'login' ? "New here?" : "Already a member?"} 
            <button onClick={() => setView(type === 'login' ? 'register' : 'login')} className="ml-2 text-blue-600 font-black hover:underline underline-offset-4">
              {type === 'login' ? 'Join Now' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function PostProductView({ user, setView }) {
  const [formData, setFormData] = useState({ 
    name: '', price: '', phone: '', description: '', 
    category: '', niche: '', location: '', imageUrl: '', showEmail: false 
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
        ...formData,
        sellerId: user.uid,
        sellerEmail: user.email,
        createdAt: serverTimestamp()
      });
      setView('home');
    } catch (err) { console.error(err); setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-3xl shadow-sm border">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">List Your Item</h2>
        <p className="text-slate-500">Reach thousands of buyers in seconds.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Product Title</label>
            <input required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. MacBook Pro 2023" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Price ($)</label>
            <input type="number" required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Category</label>
            <select required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, niche: ''})}>
              <option value="">Select Category</option>
              {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Niche</label>
            <select required disabled={!formData.category} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.niche} onChange={e => setFormData({...formData, niche: e.target.value})}>
              <option value="">Select Niche</option>
              {formData.category && CATEGORIES[formData.category].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1 text-blue-600">Contact Number</label>
            <input type="tel" required className="w-full p-4 bg-blue-50 border-blue-100 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 234..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Location</label>
            <input required className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="City, State" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-400 ml-1">Product Image URL</label>
          <div className="relative">
            <ImageIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="w-full pl-12 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://image.url/photo.jpg" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-400 ml-1">Description</label>
          <textarea required rows="4" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe the condition, features, etc." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={formData.showEmail} onChange={e => setFormData({...formData, showEmail: e.target.checked})} />
            <div className={`w-12 h-6 rounded-full transition ${formData.showEmail ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition transform ${formData.showEmail ? 'translate-x-6' : ''}`}></div>
          </div>
          <span className="text-sm font-bold text-slate-600">Show my email to buyers (Optional)</span>
        </label>

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button type="button" onClick={() => setView('home')} className="flex-1 py-4 px-6 border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition">Discard</button>
          <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white py-4 px-6 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-blue-200 transition disabled:opacity-50 active:scale-95">
            {loading ? 'Publishing...' : 'Publish Item'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminPanel({ products, userId }) {
  const deleteItem = async (id) => {
    if (confirm("Delete this listing permanently?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
             <ShieldCheck className="text-purple-400" />
             <h2 className="text-3xl font-black">Admin Access</h2>
          </div>
          <p className="text-slate-400 text-sm max-w-md">You have elevated permissions. Your User ID is linked below. Use it to verify your status in the Firebase Console.</p>
          <div className="mt-6 flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 group">
             <code className="text-xs font-mono text-purple-300 break-all flex-1">{userId}</code>
             <button 
                onClick={() => {
                  navigator.clipboard.writeText(userId);
                  alert("UID copied!");
                }}
                className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition"
             >
               <Copy size={16} />
             </button>
          </div>
        </div>
        
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center w-full md:w-auto min-w-[180px]">
          <div className="text-4xl font-black text-purple-400 mb-1">{products.length}</div>
          <div className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Total Listings</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Product & Category</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Seller Identity</th>
                <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-6">
                    <div className="font-black text-slate-800">{p.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{p.category}</span>
                      <span className="text-xs text-slate-400">{p.niche}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-sm font-medium text-slate-700">{p.sellerEmail}</div>
                    <div className="text-xs text-slate-400 font-mono mt-1">{p.phone}</div>
                  </td>
                  <td className="p-6 text-center">
                    <button onClick={() => deleteItem(p.id)} className="text-red-400 p-3 hover:bg-red-50 hover:text-red-600 rounded-2xl transition" title="Force Delete">
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && <div className="p-10 text-center text-slate-400 italic">No listings to moderate.</div>}
      </div>
    </div>
  );
}