
import React, { useState } from 'react';

const STATIONARY_ITEMS = [
  { id: 1, name: 'Precision Geometry Box', price: '₹249', category: 'Math', icon: '📐', description: 'Complete set for high-school geometry.' },
  { id: 2, name: 'Scientific Calculator', price: '₹999', category: 'Science', icon: '🧮', description: 'Advanced functions for Physics & Chem.' },
  { id: 3, name: 'Smart Notebook (A4)', price: '₹120', category: 'Notes', icon: '📓', description: 'High-quality 120GSM paper for diagrams.' },
  { id: 4, name: 'Eco-friendly Pens (10pk)', price: '₹150', category: 'Writing', icon: '🖊️', description: 'Smooth grip, recycled materials.' },
  { id: 5, name: 'Periodic Table Poster', price: '₹80', category: 'Chemistry', icon: '🧪', description: 'High-res large format for your room.' },
  { id: 6, name: 'Exam Pad with Clipboard', price: '₹199', category: 'Exams', icon: '📋', description: 'Sturdy board for smooth writing.' }
];

const StorePanel: React.FC = () => {
  const [cart, setCart] = useState<number[]>([]);

  const toggleCart = (id: number) => {
    setCart(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Sarthi Stationary Hub</h3>
        <div className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-indigo-100">
          🛒 {cart.length} items
        </div>
      </div>

      <p className="text-sm text-slate-500 bg-slate-100 p-3 rounded-xl">
        Get the right tools to complement your learning. Delivered within your school campus.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STATIONARY_ITEMS.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-3xl">{item.icon}</span>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{item.category}</span>
            </div>
            <h4 className="font-bold text-slate-800">{item.name}</h4>
            <p className="text-xs text-slate-500 mb-4 flex-1">{item.description}</p>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
              <span className="font-bold text-indigo-600">{item.price}</span>
              <button 
                onClick={() => toggleCart(item.id)}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${cart.includes(item.id) ? 'bg-red-50 text-red-500' : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'}`}
              >
                {cart.includes(item.id) ? 'Remove' : 'Add to Bag'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorePanel;
