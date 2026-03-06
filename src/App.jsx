import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
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
import { Package, User, LogOut, PlusCircle, Phone, Trash2, ShieldCheck, ShoppingBag } from 'lucide-react';

// --- CONFIGURATION ---
// Replace this with your actual Firebase config from the Firebase Console
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-store-app';

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState('home'); // home, login, register, post, admin
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid));
        setUserData(userDoc.data());
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Products Listener
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setProducts(items.sort((a, b) => b.createdAt - a.createdAt));
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => signOut(auth).then(() => setView('home'));

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50 p-4 flex justify-between items-center shadow-sm">
        <h1 
          className="text-xl font-bold flex items-center gap-2 cursor-pointer text-blue-600"
          onClick={() => setView('home')}
        >
          <ShoppingBag size={24} /> OnlineStore
        </h1>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              {userData?.role === 'admin' && (
                <button onClick={() => setView('admin')} className="p-2 hover:bg-gray-100 rounded-full text-purple-600 border border-purple-200" title="Admin Panel">
                  <ShieldCheck size={20} />
                </button>
              )}
              <button onClick={() => setView('post')} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                <PlusCircle size={18} /> Sell
              </button>
              <button onClick={handleSignOut} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition" title="Logout">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button onClick={() => setView('login')} className="text-blue-600 font-medium px-4 py-2 hover:underline">Login</button>
          )}
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {view === 'home' && <HomeView products={products} isAdmin={userData?.role === 'admin'} />}
        {view === 'login' && <AuthForm type="login" setView={setView} />}
        {view === 'register' && <AuthForm type="register" setView={setView} />}
        {view === 'post' && <PostProductView user={user} setView={setView} />}
        {view === 'admin' && <AdminPanel products={products} />}
      </main>
    </div>
  );
}

function HomeView({ products, isAdmin }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight">Marketplace</h2>
        <p className="text-gray-500">Discover items or post your own.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition group">
            <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">
               <Package size={48} className="group-hover:scale-110 transition duration-300" />
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-bold">
                  ${product.price}
                </span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-4">{product.description}</p>
              <div className="flex items-center justify-between border-t pt-4">
                <a href={`tel:${product.phone}`} className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition">
                  <Phone size={16} /> {product.phone}
                </a>
                <span className="text-xs text-gray-400">By {product.sellerEmail?.split('@')[0]}</span>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-center col-span-full py-20 text-gray-400 italic">No products available yet.</p>}
      </div>
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
        // Create user document
        await setDoc(doc(db, 'artifacts', appId, 'users', res.user.uid), {
          email,
          role: 'user',
          createdAt: serverTimestamp()
        });
      }
      setView('home');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl shadow-xl border">
      <h2 className="text-2xl font-bold mb-6 text-center capitalize">{type}</h2>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input 
            type="email" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          {type === 'login' ? 'Login' : 'Create Account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        {type === 'login' ? "Don't have an account?" : "Already have an account?"} 
        <button onClick={() => setView(type === 'login' ? 'register' : 'login')} className="ml-1 text-blue-600 font-bold hover:underline">
          {type === 'login' ? 'Register' : 'Login'}
        </button>
      </p>
    </div>
  );
}

function PostProductView({ user, setView }) {
  const [formData, setFormData] = useState({ name: '', price: '', phone: '', description: '' });
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
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
      <h2 className="text-2xl font-bold mb-6">List Your Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input 
              required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="e.g. iPhone 13 Pro"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input 
              type="number" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="0.00"
              value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Your Phone Number (For calls)</label>
          <input 
            type="tel" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="+1 234 567 890"
            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea 
            required rows="4" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="Tell buyers about the condition, etc."
            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => setView('home')} className="flex-1 px-4 py-3 border rounded-lg font-bold hover:bg-gray-50 transition text-gray-600">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Posting...' : 'Post Now'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminPanel({ products }) {
  const deleteItem = async (id) => {
    if (confirm("Delete this listing?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="bg-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck /> Admin Dashboard
        </h2>
        <p className="opacity-80">Managing {products.length} live listings.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-bold text-gray-600 uppercase">Product</th>
              <th className="p-4 font-bold text-gray-600 uppercase">Seller</th>
              <th className="p-4 font-bold text-gray-600 uppercase text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-green-600 font-medium">${p.price}</div>
                </td>
                <td className="p-4">
                  <div className="text-gray-700">{p.sellerEmail}</div>
                  <div className="text-xs text-gray-400">{p.phone}</div>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => deleteItem(p.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition" title="Remove Listing">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}