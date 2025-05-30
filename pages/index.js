import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    serviceName: '',
    monthlyCost: '',
    billingCycle: 'monthly',
    category: ''
  });

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '8px'
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    totalBox: {
      backgroundColor: '#f0fdf4',
      padding: '12px 16px',
      borderRadius: '8px'
    },
    totalText: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#166534'
    },
    button: {
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600'
    },
    form: {
      backgroundColor: '#f9fafb',
      padding: '24px',
      borderRadius: '8px',
      marginBottom: '24px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px'
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    },
    select: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    },
    subscriptionItem: {
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    subscriptionInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: 1
    },
    serviceName: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827'
    },
    category: {
      backgroundColor: '#e5e7eb',
      color: '#374151',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    price: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2563eb'
    },
    modal: {
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
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      maxWidth: '400px',
      width: '90%'
    }
  };

  // ローカルストレージからデータ読み込み
  useEffect(() => {
    const saved = localStorage.getItem('subscriptions');
    if (saved) {
      setSubscriptions(JSON.parse(saved));
    }
  }, []);

  // データをローカルストレージに保存
  const saveToStorage = (data) => {
    localStorage.setItem('subscriptions', JSON.stringify(data));
  };

  // 月額総額を計算
  const calculateMonthlyTotal = () => {
    return subscriptions.reduce((total, sub) => {
      const cost = parseFloat(sub.monthlyCost) || 0;
      return total + (sub.billingCycle === 'yearly' ? cost / 12 : cost);
    }, 0);
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      serviceName: '',
      monthlyCost: '',
      billingCycle: 'monthly',
      category: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  // サブスク追加・更新
  const handleSubmit = () => {
    if (!formData.serviceName || !formData.monthlyCost) {
      alert('サービス名と料金は必須です');
      return;
    }

    const newSub = {
      id: editingId || Date.now().toString(),
      serviceName: formData.serviceName,
      monthlyCost: parseFloat(formData.monthlyCost),
      billingCycle: formData.billingCycle,
      category: formData.category || 'その他',
      createdAt: editingId ? subscriptions.find(s => s.id === editingId)?.createdAt : new Date().toISOString()
    };

    let updatedSubs;
    if (editingId) {
      updatedSubs = subscriptions.map(sub => 
        sub.id === editingId ? newSub : sub
      );
    } else {
      updatedSubs = [...subscriptions, newSub];
    }

    setSubscriptions(updatedSubs);
    saveToStorage(updatedSubs);
    resetForm();
  };

  // 編集開始
  const startEdit = (sub) => {
    setFormData({
      serviceName: sub.serviceName,
      monthlyCost: sub.monthlyCost.toString(),
      billingCycle: sub.billingCycle,
      category: sub.category
    });
    setEditingId(sub.id);
    setShowForm(true);
  };

  // 削除確認
  const confirmDelete = (id) => {
    setDeleteConfirm(id);
  };

  // 削除実行
  const executeDeletion = () => {
    if (deleteConfirm) {
      const updatedSubs = subscriptions.filter(sub => sub.id !== deleteConfirm);
      setSubscriptions(updatedSubs);
      saveToStorage(updatedSubs);
      setDeleteConfirm(null);
    }
  };

  // 削除キャンセル
  const cancelDeletion = () => {
    setDeleteConfirm(null);
  };

  // カテゴリ別色分け
  const getCategoryColor = (category) => {
    const colors = {
      'アプリ': { backgroundColor: '#f3e8ff', color: '#7c3aed' },
      'ストレージ': { backgroundColor: '#dbeafe', color: '#2563eb' },
      '生成': { backgroundColor: '#dcfce7', color: '#16a34a' },
      'その他': { backgroundColor: '#f3f4f6', color: '#6b7280' }
    };
    return colors[category] || colors['その他'];
  };

  return (
    <>
      <Head>
        <title>サブスクリプション管理</title>
        <meta name="description" content="サブスクリプション管理アプリ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            サブスクリプション管理
          </h1>
          <div style={styles.headerRow}>
            <p style={{ color: '#6b7280' }}>
              登録サービス: {subscriptions.length}件
            </p>
            <div style={styles.totalBox}>
              <span style={styles.totalText}>
                月額総額: ¥{calculateMonthlyTotal().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 追加ボタン */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowForm(true)}
            style={styles.button}
          >
            + 新規追加
          </button>
        </div>

        {/* フォーム */}
        {showForm && (
          <div style={styles.form}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              {editingId ? 'サブスクリプション編集' : '新規サブスクリプション追加'}
            </h2>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>サービス名 *</label>
                <input
                  type="text"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
                  style={styles.input}
                  placeholder="Netflix, Spotify..."
                />
              </div>
              <div>
                <label style={styles.label}>料金 *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthlyCost}
                  onChange={(e) => setFormData({...formData, monthlyCost: e.target.value})}
                  style={styles.input}
                  placeholder="1000"
                />
              </div>
              <div>
                <label style={styles.label}>課金サイクル</label>
                <select
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                  style={styles.select}
                >
                  <option value="monthly">月額</option>
                  <option value="yearly">年額</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>カテゴリ</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={styles.select}
                >
                  <option value="">選択してください</option>
                  <option value="アプリ">アプリ</option>
                  <option value="ストレージ">ストレージ</option>
                  <option value="生成">生成</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSubmit}
                style={styles.button}
              >
                {editingId ? '更新' : '追加'}
              </button>
              <button
                onClick={resetForm}
                style={{
                  ...styles.button,
                  backgroundColor: '#6b7280'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 削除確認モーダル */}
        {deleteConfirm && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>削除確認</h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                「{subscriptions.find(s => s.id === deleteConfirm)?.serviceName}」を削除しますか？
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={cancelDeletion}
                  style={{
                    ...styles.button,
                    backgroundColor: '#6b7280'
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={executeDeletion}
                  style={{
                    ...styles.button,
                    backgroundColor: '#dc2626'
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* サブスクリスト */}
        {subscriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '18px' }}>
              まだサブスクリプションが登録されていません
            </p>
            <p style={{ color: '#9ca3af', marginTop: '8px' }}>
              「新規追加」ボタンから最初のサービスを追加してみましょう
            </p>
          </div>
        ) : (
          <div>
            {subscriptions.map((sub) => (
              <div key={sub.id} style={styles.subscriptionItem}>
                <div style={styles.subscriptionInfo}>
                  <h3 style={styles.serviceName}>
                    {sub.serviceName}
                  </h3>
                  <span style={{
                    ...styles.category,
                    ...getCategoryColor(sub.category)
                  }}>
                    {sub.category}
                  </span>
                  <span style={styles.price}>
                    ¥{sub.monthlyCost.toLocaleString()}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    {sub.billingCycle === 'monthly' ? '月額' : '年額'}
                  </span>
                  {sub.billingCycle === 'yearly' && (
                    <span style={{ color: '#16a34a', fontSize: '14px' }}>
                      (月額換算: ¥{Math.round(sub.monthlyCost / 12).toLocaleString()})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => startEdit(sub)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => confirmDelete(sub.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
