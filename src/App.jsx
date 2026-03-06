import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  signInAnonymously,
  signInWithCustomToken
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
  X,
  Facebook,
  Twitter,
  Instagram,
  Globe,
  ArrowRight,
  LayoutGrid,
  Heart,
  User,
  Settings,
  CloudUpload
} from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = JSON.parse(__firebase_config);
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
  const [filters, setFilters] = useState({ category: '', niche: '', location: '', search: '' });
  const [isPushing, setIsPushing] = useState(false);

  // RULE 3: Auth Before Queries
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Only attempt to fetch/set user data once we have a UID
        const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info');
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            const newData = { email: currentUser.email || 'anonymous', role: 'user', uid: currentUser.uid };
            await setDoc(userDocRef, newData);
            setUserData(newData);
          }
        } catch (e) {
          console.error("User Profile Error:", e);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // RULE 2 & 3: Fetch products only after auth
  useEffect(() => {
    if (!user) return;

    // Use specific path from RULE 1
    const productCol = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const q = query(productCol);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      // Sort in JS to avoid index requirement (RULE 2)
      setProducts(items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => {
      console.error("Firestore Permission/Query Error:", err);
    });
    
    return () => unsubscribe();
  }, [user]);

  // --- PUSH COMMAND IMPLEMENTATION ---
  const handlePushToCloud = async () => {
    if (!user) return;
    setIsPushing(true);
    try {
      // Logic for a global "Push" usually involves syncing local state or triggering a refresh
      // Here we simulate a sync of user preferences or current view state to the cloud
      const syncRef = doc(db, 'artifacts', appId, 'users', user.uid, 'sync', 'last_state');
      await setDoc(syncRef, {
        lastView: view,
        timestamp: serverTimestamp(),
        filters: filters
      });
      console.log("Push successful: State synced to cloud.");
    } catch (err) {
      console.error("Push failed:", err);
    } finally {
      setTimeout(() => setIsPushing(false), 1000);
    }
  };

  const handleSignOut = () => signOut(auth).then(() => setView('home'));

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold tracking-widest animate-pulse">FILA MARKET</p>
    </div>
  );

  if (view === 'login' || view === 'register') {
    return <AuthForm type={view} setView={setView} />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <ShoppingBag size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">
              FILA<span className="text-blue-600">.</span>
            </h1>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <button onClick={() => { setFilters({category: '', niche: '', location: '', search: ''}); setView('home'); }} className={`text-sm font-bold ${view === 'home' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}>Marketplace</button>
            <button className="text-sm font-bold text-slate-500 hover:text-slate-900 transition">How it works</button>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {/* Push Button */}
          {user && (
            <button 
              onClick={handlePushToCloud}
              className={`p-2.5 rounded-full transition flex items-center gap-2 ${isPushing ? 'text-blue-400 animate-pulse' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
              title="Push changes to cloud"
            >
              <CloudUpload size={22} />
              <span className="text-xs font-bold hidden md:inline">{isPushing ? 'Pushing...' : 'Push'}</span>
            </button>
          )}

          {user && !user.isAnonymous ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setView('post')} className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-100">
                <PlusCircle size={18} /> Sell Now
              </button>
              {userData?.role === 'admin' && (
                <button onClick={() => setView('admin')} className="p-2.5 hover:bg-purple-50 rounded-full text-purple-600 transition">
                  <ShieldCheck size={22} />
                </button>
              )}
              <div className="relative group">
                <button className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 font-bold">
                  {(user.email || 'U')[0].toUpperCase()}
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-[60]">
                   <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-2"><LogOut size={16}/> Logout</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setView('login')} className="text-slate-600 font-bold px-4 py-2 text-sm hover:text-blue-600 transition">Log In</button>
              <button onClick={() => setView('register')} className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-100">Sign Up</button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 w-full">
        {view === 'home' && (
          <HomeView products={products} filters={filters} setFilters={setFilters} />
        )}
        {view === 'post' && <PostProductView user={user} setView={setView} />}
        {view === 'admin' && <AdminPanel products={products} userId={user?.uid} />}
      </main>

      <footer className="bg-slate-900 text-white pt-20 pb-10 mt-auto">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-blue-600 p-2 rounded-xl text-white"><ShoppingBag size={24} /></div>
                <h2 className="text-2xl font-black tracking-tight">FILA<span className="text-blue-500">.</span></h2>
              </div>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-sm">Revolutionizing the way you trade machinery, tech, and fashion.</p>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400"><Facebook size={20} /></div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400"><Twitter size={20} /></div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400"><Instagram size={20} /></div>
              </div>
            </div>
            <div className="md:col-span-8 bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
              <h3 className="text-xl font-bold mb-4">Start Selling Today</h3>
              <p className="text-slate-400 mb-6 text-sm">Join over 50,000+ verified sellers and turn your items into cash instantly.</p>
              <button onClick={() => setView(user && !user.isAnonymous ? 'post' : 'login')} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-12 rounded-2xl transition shadow-lg">Create Listing</button>
            </div>
          </div>
          <div className="border-t border-white/5 pt-10 text-center text-slate-500 text-sm font-bold">
            <p>© 2024 FILA MARKET. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomeView({ products, filters, setFilters }) {
  const filteredProducts = products.filter(p => {
    return (
      (!filters.category || p.category === filters.category) &&
      (!filters.niche || p.niche === filters.niche) &&
      (!filters.location || p.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
      (!filters.search || p.name.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  return (
    <div className="w-full">
      <section className="relative w-full h-[500px] flex items-center bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent z-10"></div>
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center"></div>
        </div>
        <div className="max-w-[1400px] mx-auto px-8 relative z-20 text-white">
          <div className="max-w-3xl">
            <h2 className="text-6xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter">
              The Best Place <br/> To <span className="text-blue-500">Trade.</span>
            </h2>
            <p className="text-slate-400 text-xl mb-10 max-w-xl font-medium">Buy and sell quality items across fashion, high-end electronics, and heavy industrial machinery.</p>
            <button onClick={() => document.getElementById('marketplace-grid').scrollIntoView({ behavior: 'smooth' })} className="bg-white text-slate-900 px-10 py-5 rounded-full font-black text-lg hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2">
              Explore Market <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white sticky top-[72px] z-40 border-b border-slate-100 px-8 py-6 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row items-center gap-6">
          <div className="w-full xl:w-1/3 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search products..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
          </div>
          <div className="w-full xl:flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
             <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold appearance-none" value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value, niche: ''})}>
                 <option value="">All Categories</option>
                 {Object.keys(CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
             <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold appearance-none disabled:opacity-30" disabled={!filters.category} value={filters.niche} onChange={(e) => setFilters({...filters, niche: e.target.value})}>
                 <option value="">Specific Niche</option>
                 {filters.category && CATEGORIES[filters.category].map(n => <option key={n} value={n}>{n}</option>)}
             </select>
             <input type="text" placeholder="Location..." className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})} />
          </div>
        </div>
      </section>

      <section id="marketplace-grid" className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="group border border-slate-100 rounded-[2rem] p-4 hover:shadow-xl transition-all">
              <div className="aspect-[4/5] bg-slate-50 rounded-[1.5rem] overflow-hidden relative mb-6">
                {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={48} /></div>}
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{product.category}</div>
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xl font-black text-slate-900">{product.name}</h4>
                <span className="text-blue-600 font-black">${product.price}</span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-4">{product.location} • {product.niche}</p>
              <a href={`tel:${product.phone}`} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition">
                <Phone size={16} /> Contact Seller
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AuthForm({ type, setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (type === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'users', res.user.uid, 'profile', 'info'), { email, role: 'user', createdAt: serverTimestamp() });
      }
      setView('home');
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden">
      <div className="hidden lg:flex w-1/2 bg-slate-950 p-16 flex-col justify-center relative">
        <h2 className="text-6xl font-black text-white leading-tight">Join the world's <br/> finest marketplace.</h2>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h3 className="text-4xl font-black mb-10">{type === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="email" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-900 transition shadow-lg">
              {type === 'login' ? 'Log In' : 'Sign Up'}
            </button>
            <button type="button" onClick={() => setView('home')} className="w-full text-slate-400 font-bold py-2">Cancel</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PostProductView({ user, setView }) {
  const [formData, setFormData] = useState({ name: '', price: '', phone: '', description: '', category: '', niche: '', location: '', imageUrl: '' });
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
    <div className="max-w-2xl mx-auto py-20 px-8">
      <h2 className="text-4xl font-black mb-10">List Your Item</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <input type="number" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <select required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, niche: ''})}>
            <option value="">Category</option>
            {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.niche} onChange={e => setFormData({...formData, niche: e.target.value})}>
            <option value="">Niche</option>
            {formData.category && CATEGORIES[formData.category].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Image URL" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
        <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <textarea required rows="4" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold resize-none" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-slate-900 transition shadow-lg">
          {loading ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}

function AdminPanel({ products, userId }) {
  const deleteItem = async (id) => {
    if (confirm("Delete this listing?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-20">
      <h2 className="text-4xl font-black mb-10">Admin Panel</h2>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-6 font-bold text-slate-400 uppercase text-xs">Item</th>
              <th className="p-6 font-bold text-slate-400 uppercase text-xs">Seller</th>
              <th className="p-6 font-bold text-slate-400 uppercase text-xs text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="p-6 font-bold">{p.name}</td>
                <td className="p-6 text-slate-500">{p.sellerEmail}</td>
                <td className="p-6 text-right">
                  <button onClick={() => deleteItem(p.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}