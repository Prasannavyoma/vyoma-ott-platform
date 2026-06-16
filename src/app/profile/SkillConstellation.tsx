"use client";

import React, { useEffect, useState, useRef } from 'react';

interface Node {
  id: string;
  title: string;
  percent: number;
  x: number;
  y: number;
  isCore: boolean;
}

export default function SkillConstellation({ syllabi }: { syllabi: any[] }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || syllabi.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 500;
    
    const newNodes: Node[] = [];

    // The core is at the left center
    const coreX = 80;
    const coreY = height / 2;

    newNodes.push({
      id: 'core',
      title: 'Vyoma Core',
      percent: 100,
      x: coreX,
      y: coreY,
      isCore: true
    });

    // We build a left-to-right "Constellation Spine" roadmap
    // Every node moves further to the right. 
    // They stagger up and down off the main center line to look like a constellation.
    const xSpacing = 160; 
    const yOffsets = [-120, 120, -60, 60, -140, 140, 0];

    syllabi.forEach((s, idx) => {
      const offsetX = coreX + ((idx + 1) * xSpacing);
      const offsetY = coreY + yOffsets[idx % yOffsets.length];

      newNodes.push({
        id: s.course.id,
        title: `Step ${idx + 1}: ${s.course.title}`,
        percent: s.percent,
        x: offsetX,
        y: offsetY,
        isCore: false
      });
    });

    setNodes(newNodes);
  }, [syllabi]);

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '24px', padding: '30px', marginBottom: '40px', overflow: 'hidden', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
         <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
               🌌 Knowledge Roadmap (Constellation)
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem', margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>
               A clear, linear mapping of your academic journey. Scroll horizontally to trace your progress across the stars.
            </p>
         </div>

         <div style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.03)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#46d369', boxShadow: '0 0 10px #46d369' }} />
               <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>Mastered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f26422', boxShadow: '0 0 10px #f26422' }} />
               <span style={{ color: '#ddd', fontSize: '0.8rem', fontWeight: 600 }}>In Progress</span>
            </div>
         </div>
      </div>

      {/* Horizontal scrolling wrapper */}
      <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '20px' }}>
        <div 
          ref={containerRef} 
          style={{ 
            width: Math.max(1000, nodes.length * 160 + 100) + 'px', 
            height: '500px', 
            position: 'relative', 
            background: 'linear-gradient(90deg, rgba(242,100,34,0.05) 0%, transparent 100%)', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.02)',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
          }}
        >
          
          {/* Draw SVG connections between nodes */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
             {nodes.map((n, i) => {
                if (i === 0) return null; // skip core
                
                // Connect to the previous node to form a continuous roadmap path
                const prevNode = nodes[i - 1];
                
                const isComplete = n.percent === 100 && prevNode.percent === 100;
                const isProgress = n.percent > 0 || prevNode.percent > 0;
                
                let strokeColor = 'rgba(255,255,255,0.1)';
                if (isComplete) strokeColor = 'rgba(70,211,105,0.6)';
                else if (isProgress) strokeColor = 'rgba(242,100,34,0.4)';

                return (
                  <line 
                    key={`line-${n.id}`}
                    x1={prevNode.x} y1={prevNode.y} x2={n.x} y2={n.y}
                    stroke={strokeColor}
                    strokeWidth={isComplete ? 3 : (isProgress ? 2 : 1)}
                    strokeDasharray={isComplete ? "none" : "8,8"}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                )
             })}
          </svg>

          {/* Draw interactive Nodes */}
          {nodes.map(n => {
             const isComplete = n.percent === 100;
             const isProgress = n.percent > 0 && n.percent < 100;
             const isHovered = hoveredNode === n.id;
             
             let nodeBg = '#333';
             let shadow = 'none';
             if (n.isCore) {
               nodeBg = '#fff';
               shadow = '0 0 40px rgba(255,255,255,0.8)';
             } else if (isComplete) {
               nodeBg = '#46d369';
               shadow = isHovered ? '0 0 30px rgba(70,211,105,1)' : '0 0 15px rgba(70,211,105,0.5)';
             } else if (isProgress) {
               nodeBg = '#f26422';
               shadow = isHovered ? '0 0 30px rgba(242,100,34,1)' : '0 0 15px rgba(242,100,34,0.5)';
             }

             return (
               <div 
                 key={n.id}
                 style={{
                   position: 'absolute',
                   left: n.x,
                   top: n.y,
                   transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.15)' : 'scale(1)'}`,
                   zIndex: isHovered ? 10 : 2,
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   cursor: n.isCore ? 'default' : 'pointer',
                   transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                 }}
                 onMouseEnter={() => setHoveredNode(n.id)}
                 onMouseLeave={() => setHoveredNode(null)}
               >
                  {/* The Glowing Star Dot */}
                  <div style={{
                    width: n.isCore ? '45px' : '26px',
                    height: n.isCore ? '45px' : '26px',
                    borderRadius: '50%',
                    background: nodeBg,
                    boxShadow: shadow,
                    border: n.isCore ? '4px solid #f26422' : '3px solid rgba(255,255,255,0.8)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                     {n.isCore && <span style={{ fontSize: '1.2rem' }}>🎓</span>}
                     {isComplete && !n.isCore && <span style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>}
                  </div>

                  {/* Clean Static Title Label Below Node */}
                  <div style={{
                    marginTop: '12px',
                    fontSize: '0.8rem',
                    color: '#fff',
                    fontWeight: 700,
                    textAlign: 'center',
                    maxWidth: '140px',
                    background: 'rgba(20,20,20,0.95)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${isHovered ? nodeBg : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.8)',
                    transition: 'all 0.2s',
                    zIndex: 5
                  }}>
                     <div style={{ marginBottom: '4px', lineHeight: 1.3 }}>{n.title}</div>
                     
                     {/* Exact Progress Bar injected inside the label */}
                     {!n.isCore && (
                       <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
                          <div style={{ width: `${n.percent}%`, height: '100%', background: nodeBg }} />
                       </div>
                     )}
                     
                     {!n.isCore && isHovered && (
                       <div style={{ color: nodeBg, fontSize: '0.8rem', fontWeight: 900, marginTop: '6px' }}>
                          {n.percent}%
                       </div>
                     )}
                  </div>
               </div>
             );
          })}

          {syllabi.length === 0 && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#555', fontSize: '1rem', background: 'rgba(0,0,0,0.8)', padding: '20px 40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
              Your journey is empty. Begin a course to draw your map.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
