import { useState, useEffect } from 'react';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    serviceName: '',
    monthlyCost: '',
    billingCycle: 'monthly',
    category: 'その他'
  });

  // Make.com Webhook URLs
  const API_URLS = {
    GET: 'https://hook.eu1.make.com/3wojgvgwh65kur2v3pucqwar2wjxv1q2',
    POST: 'https://hook.eu1.make.com/o7bk3wxhdopuwj1cjma3z2nobsamlsfg',
    PUT: 'https://hook.eu1.make.com/uwp93kkhlof77nlmqe2ymperak5me2rd',
    DELETE: 'https://hook.eu1.make.com/iu17526sgvhfvic71vecgpwzfjtz4wq0'
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Google Sheetsからデータ取得
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URLS.GET, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('取得データ:', data);
        
        // Google Sheetsのデータを適切な形式に変換
        const formattedData = Array.isArray(data) ? data.map(row => ({
          id: row.ID || row.id || Date.now().toString(),
          serviceName: row['サービス名'] || row.serviceName || '',
          monthlyCost: parseFloat(row['月額料金'] || row.monthlyCost || 0),
          billingCycle: row['課金サイクル'] || row.billingCycle || 'monthly',
          category: row['カテゴリ'] || row.category || 'その他'
        })).filter(item => item.serviceName) : [];
        
        setSubscriptions(formattedData);
      } else {
        console.error('データ取得失敗:', response.status);
        // フォールバック: ローカルストレージからの読み込み
        const saved = localStorage.getItem('subscriptions');
        if (saved) {
          setSubscriptions(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      // フォールバック: ローカルストレージからの読み込み
      const saved = localStorage.getItem('subscriptions');
      if (saved) {
        setSubscriptions(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  // ローカルストレージにもバックアップ保存
  const saveToLocalStorage = (data) => {
    localStorage.setItem('subscriptions', JSON.stringify(data));
  };

  const calculateTotal = () => {
    return subscriptions.reduce((total, sub) => {
      const cost = parseFloat(sub.monthlyCost) || 0;
      return total + (sub.billingCycle === 'yearly' ? cost / 12 : cost);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!formData.serviceName || !formData.monthlyCost) {
      alert('サービス名と料金は必須です');
      return;
    }

    setLoading(true);
    
    const newSub = {
      id: Date.now().toString(),
      serviceName: formData.serviceName,
      monthlyCost: parseFloat(formData.monthlyCost),
      billingCycle: formData.billingCycle,
      category: formData.category,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch(API_URLS.POST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('追加結果:', result);
        
        // Google Sheetsへの追加が成功したら、ローカルデータも更新
        const updatedSubs = [...subscriptions, newSub];
        setSubscriptions(updatedSubs);
        saveToLocalStorage(updatedSubs);
        
        // フォームリセット
        setFormData({
          serviceName: '',
          monthlyCost: '',
          billingCycle: 'monthly',
          category: 'その他'
        });
        setShowForm(false);
      } else {
        console.error('追加失敗:', response.status);
        alert('データの追加に失敗しました。ローカルに保存します。');
        
        // フォールバック: ローカルストレージのみに保存
        const updatedSubs = [...subscriptions, newSub];
        setSubscriptions(updatedSubs);
        saveToLocalStorage(updatedSubs);
        
        setFormData({
          serviceName: '',
          monthlyCost: '',
          billingCycle: 'monthly',
          category: 'その他'
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('追加エラー:', error);
      alert('ネットワークエラーが発生しました。ローカルに保存します。');
      
      // フォールバック: ローカルストレージのみに保存
      const updatedSubs = [...subscriptions, newSub];
      setSubscriptions(updatedSubs);
      saveToLocalStorage(updatedSubs);
      
      setFormData({
        serviceName: '',
        monthlyCost: '',
        billingCycle: 'monthly',
        category: 'その他'
      });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteConfirm(id);
  };

  const executeDeletion = async () => {
    if (!deleteConfirm) return;

    setLoading(true);
    
    try {
      const rowNumber = findRowNumber(deleteConfirm);
      
      const response = await fetch(API_URLS.DELETE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowNumber })
      });

      if (response.ok) {
        console.log('削除成功');
      } else {
        console.error('削除失敗:', response.status);
      }
      
      // 成功・失敗に関わらず、ローカルデータを更新（UX向上）
      const updatedSubs = subscriptions.filter(sub => sub.id !== deleteConfirm);
      setSubscriptions(updatedSubs);
      saveToLocalStorage(updatedSubs);
      setDeleteConfirm(null);
      
    } catch (error) {
      console.error('削除エラー:', error);
      
      // フォールバック: ローカルデータのみ削除
      const updatedSubs = subscriptions.filter(sub => sub.id !== deleteConfirm);
      setSubscriptions(updatedSubs);
      saveToLocalStorage(updatedSubs);
      setDeleteConfirm(null);
    } finally {
      setLoading(false);
    }
  };

  const cancelDeletion = () => {
    setDeleteConfirm(null);
  };

  // 行番号を見つける（削除用）
  const findRowNumber = (id) => {
    const index = subscriptions.findIndex(sub => sub.id === id);
    return index + 2; // ヘッダー行があるので+2
  };

  // カテゴリ色分け
  const getCategoryStyle = (category) => {
    const colors = {
      'アプリ': { backgroundColor: '#f3e8ff', color: '#7c3aed' },
      'ストレージ': { backgroundColor: '#dbeafe', color: '#2563eb' },
      '生成': { backgroundColor: '#dcfce7', color: '#16a34a' },
      'その他': { backgroundColor: '#f3f4f6', color: '#6b7280' }
    };
    return colors[category] || colors['その他'];
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        サブスクリプション管理 {loading && '(同期中...)'}
      </h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <strong>月額総額: ¥{calculateTotal().toLocaleString()}</strong>
        <span style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
          登録サービス: {subscriptions.length}件
        </span>
      </div>

      <button 
        onClick={() => setShowForm(true)}
        disabled={loading}
        style={{ 
          backgroundColor: loading ? '#ccc' : '#007bff', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px',
          marginBottom: '20px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '処理中...' : '新規追加'}
      </button>

      <button 
        onClick={fetchSubscriptions}
        disabled={loading}
        style={{ 
          backgroundColor: loading ? '#ccc' : '#28a745', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px',
          marginBottom: '20px',
          marginLeft: '10px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '同期中...' : '🔄 同期'}
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
          <div style={{ marginBottom: '10px' }}>
            <label>カテゴリ:</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="アプリ">アプリ</option>
              <option value="ストレージ">ストレージ</option>
              <option value="生成">生成</option>
              <option value="その他">その他</option>
            </select>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            style={{ 
              backgroundColor: loading ? '#ccc' : '#28a745', 
              color: 'white', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '3px',
              marginRight: '10px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '追加中...' : '追加'}
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

      {/* 削除確認モーダル */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '16px' }}>削除確認</h3>
            <p style={{ marginBottom: '24px' }}>
              「{subscriptions.find(s => s.id === deleteConfirm)?.serviceName}」を削除しますか？
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelDeletion}
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
              <button
                onClick={executeDeletion}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#ccc' : '#dc3545',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                <strong>{sub.serviceName}</strong>
                <span style={{
                  ...getCategoryStyle(sub.category),
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {sub.category}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                  ¥{sub.monthlyCost.toLocaleString()}
                </span>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  ({sub.billingCycle === 'monthly' ? '月額' : '年額'})
                </span>
                {sub.billingCycle === 'yearly' && (
                  <span style={{ color: '#28a745', fontSize: '14px' }}>
                    (月額換算: ¥{Math.round(sub.monthlyCost / 12).toLocaleString()})
                  </span>
                )}
              </div>
              <button 
                onClick={() => confirmDelete(sub.id)}
                disabled={loading}
                style={{ 
                  backgroundColor: loading ? '#ccc' : '#dc3545', 
                  color: 'white', 
                  padding: '5px 10px', 
                  border: 'none', 
                  borderRadius: '3px',
                  cursor: loading ? 'not-allowed' : 'pointer'
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
