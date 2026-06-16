import prisma from '@/lib/prisma';

export default async function UserManagementPage({ searchParams }: { searchParams: Promise<{ plan?: string, role?: string, q?: string, region?: string }> }) {
  const sp = await searchParams;

  const filterPlan = sp.plan || '';
  const filterRole = sp.role || '';
  const searchQuery = sp.q || '';
  const filterRegion = sp.region || '';

  // Dynamic Prisma Where Clause
  let whereClause: any = {};

  if (filterPlan) {
    whereClause.plan = filterPlan;
  }
  
  if (filterRole) {
    whereClause.role = filterRole;
  }

  if (filterRegion) {
    if (filterRegion === 'DOMESTIC') {
      whereClause.country = 'IN';
    } else if (filterRegion === 'ABROAD') {
      whereClause.country = { not: 'IN' };
    }
  }

  if (searchQuery) {
    whereClause.OR = [
      { email: { contains: searchQuery } },
      { name: { contains: searchQuery } }
    ];
  }

  // Fetch matching population directly
  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
           <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>User & Role Management</h1>
           <p style={{ color: '#aaa', marginTop: '5px' }}>View registered customers, search populations, and manage access tags.</p>
        </div>
        <div>
          <a href="/admin/users/import" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(242,100,34,0.3)' }}>
            📥 Bulk Import / Ingestion
          </a>
        </div>
      </div>

      {/* QUICK DISCOVERY & FILTER CONSOLE */}
      <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '25px' }}>
         <form method="GET" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
            
            <div style={{ flex: 1, minWidth: '250px' }}>
               <label style={{ display: 'block', color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Search User Name / Email</label>
               <input 
                 type="text" 
                 name="q" 
                 defaultValue={searchQuery} 
                 placeholder="Enter email or name keyword..." 
                 style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '10px 15px', borderRadius: '6px', outline: 'none' }} 
               />
            </div>

            <div>
               <label style={{ display: 'block', color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Tier Filter</label>
               <select name="plan" defaultValue={filterPlan} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '10px 12px', borderRadius: '6px', outline: 'none', minWidth: '130px' }}>
                  <option value="">-- All Plans --</option>
                  <option value="FREE">FREE</option>
                  <option value="GOLD">GOLD</option>
                  <option value="PLATINUM">PLATINUM</option>
               </select>
            </div>

            <div>
               <label style={{ display: 'block', color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Geographic Region</label>
               <select name="region" defaultValue={filterRegion} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '10px 12px', borderRadius: '6px', outline: 'none', minWidth: '150px' }}>
                  <option value="">-- All Regions --</option>
                  <option value="DOMESTIC">🇮🇳 Domestic (India)</option>
                  <option value="ABROAD">🌍 Abroad / International</option>
               </select>
            </div>

            <div>
               <label style={{ display: 'block', color: '#aaa', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>System Role</label>
               <select name="role" defaultValue={filterRole} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '10px 12px', borderRadius: '6px', outline: 'none', minWidth: '130px' }}>
                  <option value="">-- All Roles --</option>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
               </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
               <button type="submit" style={{ background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
                  🔍 Search
               </button>
               {(filterPlan || filterRole || searchQuery || filterRegion) && (
                  <a href="/admin/users" style={{ background: '#222', color: '#999', padding: '10px 15px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                     Clear
                  </a>
               )}
            </div>

         </form>
      </div>

      {/* CUSTOMER CLUSTER TABLE */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <th style={{ padding: '15px' }}>Customer Info</th>
              <th style={{ padding: '15px' }}>Current Role</th>
              <th style={{ padding: '15px' }}>Subscription Plan</th>
              <th style={{ padding: '15px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: '#555' }}>
                   🚫 No matching customer records located for the specified query.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>{u.name || 'Anonymous'}</div>
                        <div style={{ fontSize: '0.9rem', color: '#aaa' }}>{u.email}</div>
                      </div>
                      {u.country && u.country !== 'IN' && (
                        <span style={{ 
                          background: 'rgba(70, 211, 105, 0.1)', 
                          color: '#46d369', 
                          border: '1px solid rgba(70, 211, 105, 0.2)', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          🌍 Abroad ({u.country})
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                     <span style={{ 
                       background: u.role === 'ADMIN' ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255,255,255,0.05)',
                       color: u.role === 'ADMIN' ? '#e50914' : 'white',
                       padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'
                     }}>
                       {u.role}
                     </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="poster-tag" style={{ 
                        background: u.plan === 'PLATINUM' ? '#e50914' : (u.plan === 'GOLD' ? '#f26422' : '#333'),
                        padding: '4px 10px',
                        borderRadius: '3px',
                        fontWeight: 'bold'
                      }}>
                        {u.plan}
                      </span>
                      {u.planInterval && <span style={{ fontSize: '0.8rem', color: '#777' }}>({u.planInterval})</span>}
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <a href={`/admin/users/${u.id}`} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #444', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '0.9rem', textDecoration: 'none', transition: 'all 0.2s' }}>
                      📊 View Customer Profile & Orders
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
