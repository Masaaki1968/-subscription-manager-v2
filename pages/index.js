import { useState, useEffect } from 'react';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    serviceName: '',
    monthlyCost: '',
    billingCycle: 'monthly',
    category: 'その他'
  });

  useEffect(() => {
    const saved = localStorage.getItem('subscriptions');
    if (saved) {
      setSubscriptions(JSON.parse(saved));
    }
  }, []);

  const saveToStorage = (data) => {
    localStorage.setItem('subscriptions', JSON.stringify(data));
  };

  const calculateTotal = () => {
    return subscriptions.reduce((total, sub) => {
      const cost = parseFloat(sub.monthlyCost) || 0;
      return total + (sub.billingCycle === 'yearly' ? cost / 12 : cost);
    }, 0);
  };

  const handleSubmit = () => {
    if (!formData.serviceName || !formData.monthlyCost) {
      alert('サービス名と料金は必須です');
      return;
    }

    const newSub = {
      id: Date.now().toString(),
      serviceName: formData.serviceName,
      monthlyCost: parseFloat(formData.monthlyCost),
      billingCycle: formData.billingCycle,
      category: formData.category
    };

    const updatedSubs = [...subscriptions, newSub];
    setSubscriptions(updatedSubs);
    saveToStorage(updatedSubs);
    
    setFormData({
      serviceName: '',
      monthlyCost: '',
      billingCycle: 'monthly',
      category: 'その他'
    });
    setShowForm(false);
  };

  const deleteSub = (id) => {
    const updatedSubs = subscriptions.filter(sub => sub.id !== id);
    setSubscriptions(updatedSubs);
    saveToStorage(updatedSubs);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>サブスクリプション管理</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <strong>月額総額: ¥{calculateTotal().toLocaleString()}</strong>
      </div>

      <button 
        onClick={() => setShowForm(true)}
        style={{ 
          backgroundColor: '#007bff', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px',
          marginBottom: '20px',
          cursor: 'pointer'
        }}
      >
        新規追加
      </button>

      {showForm && (
        <div style={{ 
          backgroundColor: '#f9f9f9', 
          padding: '20px', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          <h3>新規サブスクリプション</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>サービス名:</label>
            <input
              type="text"
              value={formData.serviceName}
              onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
              placeholder="Netflix"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>料金:</label>
            <input
              type="number"
              value={formData.monthlyCost}
              onChange={(e) => setFormData({...formData, monthlyCost: e.target.value})}
              style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
              placeholder="1000"
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>課金サイクル:</label>
            <select
              value={formData.billingCycle}
              onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="monthly">月額</option>
              <option value="yearly">年額</option>
            </select>
          </div>
          <button 
            onClick={handleSubmit}
            style={{ 
              backgroundColor: '#28a745', 
              color: 'white', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '3px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            追加
          </button>
          <button 
            onClick={() => setShowForm(false)}
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            キャンセル
          </button>
        </div>
      )}

      <div>
        {subscriptions.length === 0 ? (
          <p>まだサブスクリプションが登録されていません</p>
        ) : (
          subscriptions.map(sub => (
            <div 
              key={sub.id} 
              style={{ 
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '5px',
                padding: '15px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong>{sub.serviceName}</strong> - 
                ¥{sub.monthlyCost.toLocaleString()} 
                ({sub.billingCycle === 'monthly' ? '月額' : '年額'})
                {sub.billingCycle === 'yearly' && (
                  <span style={{ color: '#28a745', marginLeft: '10px' }}>
                    (月額換算: ¥{Math.round(sub.monthlyCost / 12).toLocaleString()})
                  </span>
                )}
              </div>
              <button 
                onClick={() => deleteSub(sub.id)}
                style={{ 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  padding: '5px 10px', 
                  border: 'none', 
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                削除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
