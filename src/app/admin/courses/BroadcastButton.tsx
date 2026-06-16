"use client";

import { useState } from "react";
import { broadcastNewCourse } from "./actions";

export default function BroadcastButton({ courseId, courseTitle }: { courseId: string, courseTitle: string }) {
  const [loading, setLoading] = useState(false);

  async function handleBroadcast() {
    if (!confirm(`Are you sure you want to send a notification to ALL users about "${courseTitle}"?`)) return;
    
    setLoading(true);
    const res = await broadcastNewCourse(courseId);
    setLoading(false);

    if (res.error) {
      alert(res.error);
    } else {
      alert(`Success! Broadcasted notification to ${res.count} users.`);
    }
  }

  return (
    <button 
      onClick={handleBroadcast} 
      disabled={loading}
      style={{ 
        background: 'transparent', 
        border: 'none', 
        color: '#f26422', 
        cursor: loading ? 'wait' : 'pointer', 
        textDecoration: 'none', 
        fontSize: '0.9rem',
        opacity: loading ? 0.5 : 1
      }}
    >
      {loading ? 'Sending...' : 'Broadcast'}
    </button>
  );
}
