import { useState, useEffect } from 'react';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
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

  // デバッグ情報を更新
  const addDebugInfo = (info) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `${timestamp}: ${info}\n${prev}`);
    console.log(info);
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // ユニークIDを生成
  const generateId = () => {
    return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // Google Sheetsからデータ取得
  const fetchSubscriptions = async () => {
    setLoading(true);
    addDebugInfo('=== データ取得開始 ===');
    
    try {
      const response = await fetch(API_URLS.GET + '?t=' + Date.now(), {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      addDebugInfo(`GET ステータス: ${response.status}`);
      
      if (response.ok) {
        const text = await response.text();
        addDebugInfo(`生レスポンス: ${text.substring(0, 500)}...`);
        
        // "Accepted"のみの場合はローカルデータを使用
        if (text.trim() === 'Accepted' || text.trim() === '"Accepted"') {
          addDebugInfo('レスポンスが"Accepted"のみ - Make.com設定要修正');
          loadFromLocalStorage();
          return;
        }
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          addDebugInfo(`JSON解析エラー: ${e.message}`);
          loadFromLocalStorage();
          return;
        }
        
        // data.dataが存在する場合の対応
        const actualData = data.data || data;
        
        addDebugInfo(`解析後データ型: ${typeof actualData}, 配列: ${Array.isArray(actualData)}`);
        
        if (Array.isArray(actualData)) {
          addDebugInfo(`配列長: ${actualData.length}`);
          
          const formattedData = actualData
            .map((row, index) => {
              addDebugInfo(`行${index + 1}: ${JSON.stringify(row)}`);
              
              // Make.comの数字キー形式に対応
              const id = row['0'] || generateId();
              const serviceName = row['1'] || '';
              const monthlyCost = parseFloat(row['2']) || 0;
              const billingCycle = row['3'] || 'monthly';
              const category = row['4'] || 'その他';
              const createdAt = row['5'] || '';
              
              addDebugInfo(`変換: ${serviceName} - ¥${monthlyCost} - ${billingCycle} - ${category}`);
              
              return {
                id: id,
                serviceName: serviceName,
                monthlyCost: monthlyCost,
                billingCycle: billingCycle,
                category: category,
                createdAt: createdAt,
                originalRow: index + 2 // Google Sheetsの行番号（ヘッダー考慮）
              };
            })
            .filter(item => {
              // ヘッダー行や空行を除外
              const isValid = item.serviceName && 
                             item.serviceName.trim() !== '' &&
                             item.monthlyCost > 0;
              addDebugInfo(`行有効性: "${item.serviceName}" (料金:${item.monthlyCost}) -> ${isValid}`);
              return isValid;
            });
          
          addDebugInfo(`有効データ: ${formattedData.length}件`);
          setSubscriptions(formattedData);
          
          // ローカルストレージにも保存
          localStorage.setItem('subscriptions', JSON.stringify(formattedData));
          
        } else {
          addDebugInfo('データが配列ではありません');
          loadFromLocalStorage();
        }
      } else {
        addDebugInfo(`データ取得失敗: ${response.status} ${response.statusText}`);
        loadFromLocalStorage();
      }
    } catch (error) {
      addDebugInfo(`データ取得エラー: ${error.message}`);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // ローカルストレージから読み込み
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('subscriptions');
    if (saved) {
      try {
        const localData = JSON.parse(saved);
        setSubscriptions(localData);
        addDebugInfo(`ローカルデータ使用: ${localData.length}件`);
      } catch (e) {
        addDebugInfo(`ローカルデータ解析エラー: ${e.message}`);
        setSubscriptions([]);
      }
    } else {
      addDebugInfo('ローカルデータなし');
      setSubscriptions([]);
    }
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
    addDebugInfo('=== 新規追加開始 ===');
    
    const newId = generateId();
    const newSub = {
      id: newId,
      serviceName: formData.serviceName,
      monthlyCost: parseFloat(formData.monthlyCost),
      billingCycle: formData.billingCycle,
      category: formData.category,
      createdAt: new Date().toISOString().split('T')[0] // YYYY-MM-DD形式
    };

    addDebugInfo(`送信データ: ${JSON.stringify(newSub)}`);

    try {
      const response = await fetch(API_URLS.POST, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newSub)
      });

      addDebugInfo(`POST ステータス: ${response.status}`);
      
      if (response.ok) {
        const result = await response.text();
        addDebugInfo(`POST 結果: ${result}`);
        
        // ローカルに即座に追加
        const updatedSubs = [...subscriptions, { ...newSub, originalRow: subscriptions.length + 2 }];
        setSubscriptions(updatedSubs);
        localStorage.setItem('subscriptions', JSON.stringify(updatedSubs));
        
        // フォームリセット
        setFormData({
          serviceName: '',
          monthlyCost: '',
          billingCycle: 'monthly',
          category: 'その他'
        });
        setShowForm(false);
        
        // 2秒後にGoogle Sheetsから再同期
        setTimeout(() => {
          addDebugInfo('自動再同期開始');
          fetchSubscriptions();
        }, 2000);
        
      } else {
        addDebugInfo(`POST失敗: ${response.status} ${response.statusText}`);
        handleLocalSave(newSub);
      }
    } catch (error) {
      addDebugInfo(`POST エラー: ${error.message}`);
      handleLocalSave(newSub);
    } finally {
      setLoading(false);
    }
  };

  // ローカル保存処理
  const handleLocalSave = (newSub) => {
    const updatedSubs = [...subscriptions, { ...newSub, originalRow: subscriptions.length + 2 }];
    setSubscriptions(updatedSubs);
    localStorage.setItem('subscriptions', JSON.stringify(updatedSubs));
    
    setFormData({
      serviceName: '',
      monthlyCost: '',
      billingCycle: 'monthly',
      category: 'その他'
    });
    setShowForm(false);
    
    alert('ネットワークエラーが発生しました。ローカルに保存します。');
  };

  const confirmDelete = (id) => {
    setDeleteConfirm(id);
  };

  const executeDeletion = async () => {
    if (!deleteConfirm) return;

    setLoading(true);
    addDebugInfo(`=== 削除開始: ID ${deleteConfirm} ===`);
    
    // 削除対象のアイテムを見つける
    const targetItem = subscriptions.find(sub => sub.id === deleteConfirm);
    if (!targetItem) {
      addDebugInfo('削除対象が見つかりません');
      setDeleteConfirm(null);
      setLoading(false);
      return;
    }
    
    addDebugInfo(`削除対象: ${targetItem.serviceName} (行: ${targetItem.originalRow})`);
    
    try {
      // まずローカルで削除
      const updatedSubs = subscriptions.filter(sub => sub.id !== deleteConfirm);
      setSubscriptions(updatedSubs);
      localStorage.setItem('subscriptions', JSON.stringify(updatedSubs));
      setDeleteConfirm(null);
      
      // Google Sheetsからも削除を試行
      const deleteData = { 
        id: deleteConfirm,
        serviceName: targetItem.serviceName,
        rowNumber: targetItem.originalRow
      };
      
      addDebugInfo(`DELETE送信: ${JSON.stringify(deleteData)}`);
      
      const response = await fetch(API_URLS.DELETE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(deleteData)
      });

      addDebugInfo(`DELETE ステータス: ${response.status}`);
      
      if (response.ok) {
        const result = await response.text();
        addDebugInfo(`DELETE 結果: ${result}`);
        
        // 3秒後に再同期
        setTimeout(() => {
          addDebugInfo('削除後の自動再同期開始');
          fetchSubscriptions();
        }, 3000);
        
      } else {
        addDebugInfo(`Google Sheets削除失敗: ${response.status}`);
      }
      
    } catch (error) {
      addDebugInfo(`削除エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelDeletion = () => {
    setDeleteConfirm(null);
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
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        サブスクリプション管理 {loading && '(処理中...)'}
      </h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <strong>月額総額: ¥{calculateTotal().toLocaleString()}</strong>
        <span style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
          登録サービス: {subscriptions.length}件
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowForm(true)}
          disabled={loading}
          style={{ 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            marginRight: '10px',
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
            marginRight: '10px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '同期中...' : '🔄 Google Sheets同期'}
        </button>

        <button 
          onClick={() => setDebugInfo('')}
          style={{ 
            backgroundColor: '#6c757d', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ログクリア
        </button>
      </div>

      {/* デバッグ情報 */}
      {debugInfo && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '5px', 
          padding: '10px',
          marginBottom: '20px',
          fontSize: '11px',
          fontFamily: 'monospace',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <strong>デバッグ情報:</strong>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{debugInfo}</pre>
        </div>
      )}

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
          <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #ddd', borderRadius: '8px' }}>
            <p style={{ color: '#666', fontSize: '18px', margin: '0 0 10px 0' }}>
              サブスクリプションが登録されていません
            </p>
            <p style={{ color: '#999', margin: 0 }}>
              「新規追加」ボタンからサービスを追加してください
            </p>
          </div>
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
                <strong style={{ minWidth: '150px' }}>{sub.serviceName}</strong>
                <span style={{
                  ...getCategoryStyle(sub.category),
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  minWidth: '60px',
                  textAlign: 'center'
                }}>
                  {sub.category}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff', minWidth: '80px' }}>
                  ¥{sub.monthlyCost.toLocaleString()}
                </span>
                <span style={{ color: '#666', fontSize: '14px', minWidth: '40px' }}>
                  {sub.billingCycle === 'monthly' ? '月額' : '年額'}
                </span>
                {sub.billingCycle === 'yearly' && (
                  <span style={{ color: '#28a745', fontSize: '14px', minWidth: '100px' }}>
                    (月額換算: ¥{Math.round(sub.monthlyCost / 12).toLocaleString()})
                  </span>
                )}
                <small style={{ color: '#999', fontSize: '10px' }}>
                  ID: {sub.id.substring(0, 12)}... 行: {sub.originalRow || '?'}
                </small>
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
