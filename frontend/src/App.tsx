import React, { useState, useEffect } from 'react';
import { 
  Home, 
  List, 
  PieChart, 
  Sparkles, 
  User, 
  QrCode, 
  TreePine, 
  Droplet, 
  Leaf, 
  Search, 
  Filter, 
  ChevronDown, 
  ArrowLeft,
  Trash2,
  Plus,
  Send,
  MessageCircle,
  Calendar,
  DollarSign
} from 'lucide-react';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:8001';

// API Service
const apiService = {
  async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.reload();
      return;
    }

    return response;
  },

  async getReceipts() {
    const response = await this.fetchWithAuth('/api/receipts');
    if (!response) return [];
    return response.json();
  },

  async getEnvironmentalImpact() {
    const response = await this.fetchWithAuth('/api/analytics/environmental-impact');
    if (!response) return null;
    return response.json();
  },

  async getSpendingAnalytics() {
    const response = await this.fetchWithAuth('/api/analytics/spending');
    if (!response) return null;
    return response.json();
  },

  async sendChatMessage(message: string) {
    const response = await this.fetchWithAuth('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    if (!response) return { response: "Unable to connect to AI service" };
    return response.json();
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async register(email: string, password: string, name: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    return response.json();
  }
};

const suggestedQuestions = [
  'How much did I spend on groceries last month?',
  'Show my top 5 expenses in January.',
  'What was my average daily spending last week?',
  'How many trees have I saved this year?'
];

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [environmentalImpact, setEnvironmentalImpact] = useState(null);
  const [spendingAnalytics, setSpendingAnalytics] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' });
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setCurrentScreen('dashboard');
      loadData();
    }
  }, []);

  // Initialize chat messages when user logs in
  useEffect(() => {
    if (user && chatMessages.length === 0) {
      setChatMessages([{
        type: 'ai',
        message: `Hello ${user.name}! I'm your Eco Assistant. I can help you analyze your spending patterns and environmental impact. How can I help you today?`
      }]);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [receiptsData, impactData, analyticsData] = await Promise.all([
        apiService.getReceipts(),
        apiService.getEnvironmentalImpact(),
        apiService.getSpendingAnalytics()
      ]);
      
      setReceipts(receiptsData || []);
      setEnvironmentalImpact(impactData);
      setSpendingAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await apiService.login(loginForm.email, loginForm.password);
      if (result.access_token) {
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setCurrentScreen('dashboard');
        loadData();
      } else {
        alert('Login failed: ' + (result.detail || 'Unknown error'));
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await apiService.register(registerForm.email, registerForm.password, registerForm.name);
      if (result.access_token) {
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setCurrentScreen('dashboard');
        loadData();
      } else {
        alert('Registration failed: ' + (result.detail || 'Unknown error'));
      }
    } catch (error) {
      alert('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentScreen('login');
    setReceipts([]);
    setEnvironmentalImpact(null);
    setSpendingAnalytics(null);
    setChatMessages([]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const userMessage = { type: 'user', message: currentMessage };
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);
    
    try {
      const result = await apiService.sendChatMessage(currentMessage);
      const aiResponse = { 
        type: 'ai', 
        message: result.response || "I'm having trouble connecting right now. Please try again!"
      };
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse = { 
        type: 'ai', 
        message: "I'm having trouble connecting right now. Please try again!"
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setCurrentMessage(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.retailer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedReceipts = [...filteredReceipts].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.date) - new Date(b.date);
      case 'highest':
        return b.total - a.total;
      case 'lowest':
        return a.total - b.total;
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });

  const renderLoginRegister = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EcoReceipt</h1>
          <p className="text-gray-600">Digital Receipt Manager</p>
        </div>

        {!isRegisterMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-green-600 hover:text-green-700 text-sm"
          >
            {isRegisterMode ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">EcoReceipt</h1>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
          >
            <User className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Environmental Impact Card */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Your Environmental Impact</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <TreePine className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{environmentalImpact?.trees_saved || 0}</div>
              <div className="text-sm opacity-90">Trees Saved</div>
            </div>
            <div className="text-center">
              <Droplet className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{environmentalImpact?.water_saved || 0}L</div>
              <div className="text-sm opacity-90">Water Saved</div>
            </div>
            <div className="text-center">
              <Leaf className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{environmentalImpact?.co2_reduced || 0} kg</div>
              <div className="text-sm opacity-90">CO₂ Reduced</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Receipts */}
      <div className="px-4 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Receipts</h3>
        {receipts.length > 0 ? (
          <div className="space-y-3">
            {receipts.slice(0, 4).map((receipt) => (
              <div 
                key={receipt.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedReceipt(receipt);
                  setCurrentScreen('receiptDetail');
                }}
              >
                <div className="flex items-center space-x-4">
                  <img 
                    src={receipt.logo || 'https://placehold.co/50x50/4CAF50/FFFFFF?text=R'} 
                    alt={receipt.retailer} 
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{receipt.retailer}</h4>
                    <p className="text-sm text-gray-500">{receipt.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">${receipt.total.toFixed(2)}</div>
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {receipt.category}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No receipts yet. Start adding your digital receipts!</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-50">
        <button 
          onClick={() => alert('OCR functionality coming soon! For now, receipts are added via the demo data.')}
          className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        >
          <QrCode className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );

  const renderAllReceipts = () => (
    <div className="flex-1 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">All Receipts</h1>
      </header>

      {/* Search and Filter */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search receipts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Receipts List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {sortedReceipts.map((receipt) => (
            <div 
              key={receipt.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedReceipt(receipt);
                setCurrentScreen('receiptDetail');
              }}
            >
              <div className="flex items-center space-x-4">
                <img 
                  src={receipt.logo} 
                  alt={receipt.retailer} 
                  className="w-12 h-12 rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{receipt.retailer}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{receipt.date}</span>
                    <span>•</span>
                    <span>{receipt.time}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">${receipt.total.toFixed(2)}</div>
                  <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {receipt.category}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReceiptDetail = () => {
    if (!selectedReceipt) return null;

    return (
      <div className="flex-1 flex flex-col pb-20">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setCurrentScreen('receipts')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Receipt Details</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Retailer Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center space-x-4 mb-4">
              <img 
                src={selectedReceipt.logo} 
                alt={selectedReceipt.retailer} 
                className="w-16 h-16 rounded-xl"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedReceipt.retailer}</h2>
                <p className="text-gray-500">{selectedReceipt.date} • {selectedReceipt.time}</p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Items</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {selectedReceipt.items.map((item, index) => (
                <div key={index} className="px-6 py-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-semibold text-gray-900">${item.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${selectedReceipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${selectedReceipt.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">${selectedReceipt.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
              Add Note
            </button>
            <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Delete Receipt</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Spending by Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
          {spendingAnalytics?.category_breakdown && Object.keys(spendingAnalytics.category_breakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(spendingAnalytics.category_breakdown).map(([category, amount], index) => {
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
                const percentage = ((amount / spendingAnalytics.total_spent) * 100).toFixed(0);
                
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 ${colors[index % colors.length]} rounded`}></div>
                      <span className="text-gray-700">{category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No spending data available yet.</p>
            </div>
          )}
        </div>

        {/* Monthly Spending */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending</h3>
          {spendingAnalytics?.monthly_spending && spendingAnalytics.monthly_spending.length > 0 ? (
            <div className="space-y-4">
              {spendingAnalytics.monthly_spending.map((monthData, index) => {
                const maxAmount = Math.max(...spendingAnalytics.monthly_spending.map(m => m.amount));
                const percentage = maxAmount > 0 ? (monthData.amount / maxAmount) * 100 : 0;
                
                return (
                  <div key={monthData.month} className="flex items-center space-x-3">
                    <div className="w-8 text-sm font-medium text-gray-600">{monthData.month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div 
                        className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 20 && (
                          <span className="text-xs font-medium text-white">${monthData.amount}</span>
                        )}
                      </div>
                      {percentage <= 20 && (
                        <span className="absolute right-2 top-0 h-6 flex items-center text-xs font-medium text-gray-600">
                          ${monthData.amount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No monthly data available yet.</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              ${spendingAnalytics?.total_spent?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-gray-500">Total Spent</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{receipts.length}</div>
            <div className="text-sm text-gray-500">Receipts</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAIAssistant = () => (
    <div className="flex-1 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-green-500" />
          <h1 className="text-xl font-bold text-gray-900">Eco Assistant</h1>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {chatMessages.length === 1 && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Try asking me:</p>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="block w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-xl text-sm text-green-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {chatMessages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.type === 'user' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {message.type === 'ai' && (
                  <div className="flex items-center space-x-1 mb-1">
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-xs font-medium">Eco Assistant</span>
                  </div>
                )}
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Ask about your spending..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!currentMessage.trim()}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-2 rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Eco Warrior</h2>
          <p className="text-gray-600 mb-4">Making a difference, one receipt at a time</p>
          <div className="text-sm text-gray-500">
            Profile features coming soon!
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentScreen = () => {
    if (currentScreen === 'login') {
      return renderLoginRegister();
    }
    
    switch (currentScreen) {
      case 'dashboard':
        return renderDashboard();
      case 'receipts':
        return renderAllReceipts();
      case 'receiptDetail':
        return renderReceiptDetail();
      case 'analytics':
        return renderAnalytics();
      case 'ai':
        return renderAIAssistant();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-inter">
      {/* Main Content */}
      {renderCurrentScreen()}

      {/* Bottom Navigation - Only show when logged in */}
      {currentScreen !== 'login' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex justify-around">
            {[
              { id: 'dashboard', icon: Home, label: 'Home' },
              { id: 'receipts', icon: List, label: 'Receipts' },
              { id: 'analytics', icon: PieChart, label: 'Analytics' },
              { id: 'ai', icon: Sparkles, label: 'AI Chat' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setCurrentScreen(id)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  currentScreen === id 
                    ? 'text-green-500 bg-green-50' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;