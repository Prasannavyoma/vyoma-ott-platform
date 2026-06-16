'use client';

import React, { useState, useEffect } from 'react';
import { getAllReviewsForAdmin, approveReview, disapproveReview } from '@/app/actions/comments';
import Link from 'next/link';

interface ReviewWithUserAndCourse {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
  course: {
    id: string;
    title: string;
  };
}

export default function CommentsModerationPage() {
  const [reviews, setReviews] = useState<ReviewWithUserAndCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load reviews on mount
  async function fetchReviews() {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await getAllReviewsForAdmin();
      // Cast the reviews array
      setReviews(data as any);
      setAuthorized(true);
    } catch (err: any) {
      console.error(err);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  // Handle Approve Action
  const handleApprove = async (id: string) => {
    if (actioningId) return;
    setActioningId(id);
    setFeedback(null);
    try {
      const res = await approveReview(id);
      if (res.success) {
        setReviews(prev =>
          prev.map(r => (r.id === id ? { ...r, approved: true } : r))
        );
        setFeedback({ type: 'success', message: 'Comment approved successfully!' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to approve comment.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'An unexpected error occurred.' });
    } finally {
      setActioningId(null);
    }
  };

  // Handle Disapprove / Delete Action
  const handleDisapprove = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this comment? This action cannot be undone.')) {
      return;
    }
    if (actioningId) return;
    setActioningId(id);
    setFeedback(null);
    try {
      const res = await disapproveReview(id);
      if (res.success) {
        setReviews(prev => prev.filter(r => r.id !== id));
        setFeedback({ type: 'success', message: 'Comment deleted successfully!' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete comment.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'An unexpected error occurred.' });
    } finally {
      setActioningId(null);
    }
  };

  if (authorized === false) {
    return (
      <div style={{ padding: '40px', color: '#ff4d4f', textAlign: 'center', background: 'rgba(255, 77, 79, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 77, 79, 0.2)', margin: '40px auto', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
        <p style={{ marginTop: '10px', color: '#aaa' }}>Admin or Super Admin authority is required to access the comments moderation dashboard.</p>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'underline', marginTop: '15px', display: 'inline-block', fontWeight: 'bold' }}>Return to Overview</Link>
      </div>
    );
  }

  // Filter reviews by active tab
  const filteredReviews = reviews.filter(r => {
    if (activeTab === 'pending') return !r.approved;
    if (activeTab === 'approved') return r.approved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.approved).length;
  const approvedCount = reviews.filter(r => r.approved).length;
  const totalCount = reviews.length;

  return (
    <div style={{ paddingBottom: '60px', color: '#fff' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .review-moderation-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .review-moderation-card:hover {
          transform: translateY(-2px) scale(1.002);
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .tab-filter-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .tab-filter-btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .action-approve-btn {
          transition: all 0.2s !important;
        }
        .action-approve-btn:hover {
          opacity: 0.95 !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(70,211,105,0.4) !important;
        }
        .action-delete-btn {
          transition: all 0.2s !important;
        }
        .action-delete-btn:hover {
          background: rgba(255, 77, 79, 0.15) !important;
          border-color: rgba(255, 77, 79, 0.5) !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(255,77,79,0.1) !important;
        }
        .refresh-btn {
          transition: all 0.2s !important;
        }
        .refresh-btn:hover {
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(255,255,255,0.2) !important;
          transform: translateY(-1px);
        }
      ` }} />
      {/* HEADER SECTION */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 className="admin-title" style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Comments Moderation</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Approve, filter, or remove user feedback and reviews before they display publicly on course watch pages.</p>
        </div>
        <div>
          <button 
            onClick={fetchReviews}
            disabled={loading}
            className="refresh-btn"
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', 
              padding: '12px 20px', 
              borderRadius: '8px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', 
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
          >
            {loading ? '⏱ Loading...' : '🔄 Refresh Queue'}
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {feedback && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: feedback.type === 'success' ? '1px solid rgba(70,211,105,0.3)' : '1px solid rgba(255,77,79,0.3)',
          background: feedback.type === 'success' ? 'rgba(70,211,105,0.08)' : 'rgba(255,77,79,0.08)',
          color: feedback.type === 'success' ? '#46d369' : '#ff4d4f',
          fontWeight: 600,
          fontSize: '0.95rem'
        }}>
          {feedback.type === 'success' ? '✅' : '❌'} {feedback.message}
        </div>
      )}

      {/* TAB FILTERS */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '25px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '15px'
      }}>
        <button 
          onClick={() => setActiveTab('pending')}
          className="tab-filter-btn"
          style={{
            padding: '10px 20px',
            borderRadius: '20px',
            border: activeTab === 'pending' ? '1px solid var(--primary, #f26422)' : '1px solid rgba(255,255,255,0.05)',
            background: activeTab === 'pending' ? 'rgba(242,100,34,0.1)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'pending' ? 'var(--primary, #f26422)' : '#888',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
        >
          ⏳ Pending Approval ({pendingCount})
        </button>
        <button 
          onClick={() => setActiveTab('approved')}
          className="tab-filter-btn"
          style={{
            padding: '10px 20px',
            borderRadius: '20px',
            border: activeTab === 'approved' ? '1px solid #46d369' : '1px solid rgba(255,255,255,0.05)',
            background: activeTab === 'approved' ? 'rgba(70,211,105,0.1)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'approved' ? '#46d369' : '#888',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
        >
          ✅ Approved ({approvedCount})
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className="tab-filter-btn"
          style={{
            padding: '10px 20px',
            borderRadius: '20px',
            border: activeTab === 'all' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.05)',
            background: activeTab === 'all' ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'all' ? '#38bdf8' : '#888',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
        >
          🌐 All Comments ({totalCount})
        </button>
      </div>

      {/* QUEUE LOADER / CONTENT */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '25px',
              height: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ width: '30%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                  <div style={{ width: '15%', height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}></div>
                </div>
              </div>
              <div style={{ width: '80%', height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}></div>
            </div>
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          color: '#888'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>📭</span>
          <h3 style={{ fontSize: '1.2rem', color: '#ccc', fontWeight: 'bold' }}>No comments found</h3>
          <p style={{ marginTop: '5px', fontSize: '0.9rem' }}>No comments match the selected moderation status: <strong style={{ color: '#fff' }}>{activeTab}</strong></p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredReviews.map((review) => {
            const isPending = !review.approved;
            const isActioning = actioningId === review.id;
            const reviewDate = new Date(review.createdAt).toLocaleString();
            
            return (
              <div 
                key={review.id} 
                className="review-moderation-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(10px)',
                  border: isPending ? '1px solid rgba(242, 100, 34, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '25px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                {/* Pending Status Highlight strip */}
                {isPending && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '4px',
                    background: 'var(--primary, #f26422)'
                  }} />
                )}

                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: 'var(--primary, #f26422)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {(review.user?.name || review.user?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.05rem' }}>
                          {review.user?.name || 'Anonymous User'}
                        </h4>
                        {review.user?.role && review.user?.role !== 'USER' && (
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: review.user.role === 'SUPER_ADMIN' ? 'rgba(255,77,79,0.15)' : 'rgba(56,189,248,0.15)',
                            color: review.user.role === 'SUPER_ADMIN' ? '#ff4d4f' : '#38bdf8',
                            border: review.user.role === 'SUPER_ADMIN' ? '1px solid rgba(255,77,79,0.3)' : '1px solid rgba(56,189,248,0.3)',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {review.user.role}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                        {review.user?.email} • {reviewDate}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars & Course Badge */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <div style={{ color: '#ffd700', fontSize: '1.1rem' }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx}>{idx < review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <Link 
                      href={`/watch/${review.courseId}`}
                      target="_blank"
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--primary, #f26422)',
                        textDecoration: 'none',
                        background: 'rgba(242,100,34,0.08)',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        border: '1px solid rgba(242,100,34,0.15)'
                      }}
                    >
                      🎥 {review.course?.title || 'Unknown Course'}
                    </Link>
                  </div>
                </div>

                {/* Comment Content */}
                <div style={{
                  background: 'rgba(0,0,0,0.15)',
                  padding: '15px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.03)',
                  marginBottom: '20px',
                  color: '#ddd',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  fontStyle: review.comment ? 'normal' : 'italic'
                }}>
                  {review.comment ? `"${review.comment}"` : 'No comment text provided.'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  {isPending && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={isActioning}
                      style={{
                        background: '#46d369',
                        color: '#000',
                        border: 'none',
                        padding: '10px 22px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: isActioning ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.2s',
                        opacity: isActioning ? 0.6 : 1,
                        boxShadow: '0 4px 10px rgba(70,211,105,0.2)'
                      }}
                    >
                      {isActioning ? '⏱ Processing...' : '✅ Approve Comment'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDisapprove(review.id)}
                    disabled={isActioning}
                    style={{
                      background: 'rgba(255,77,79,0.1)',
                      border: '1px solid rgba(255,77,79,0.3)',
                      color: '#ff4d4f',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      cursor: isActioning ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isActioning ? 0.6 : 1
                    }}
                  >
                    {isActioning ? '⏱ Processing...' : '🗑️ Delete Comment'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
