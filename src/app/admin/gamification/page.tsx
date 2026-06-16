import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function GamificationPage() {
  // Fetch current values
  let nameReward = "1";
  let profileReward = "10";
  let videoReward = "2";
  let courseReward = "2";
  let quizReward = "50";
  let memorizerReward = "15";
  let coachReward = "20";

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'COINS_NAME_REWARD', 
            'COINS_PROFILE_REWARD', 
            'COINS_VIDEO_REWARD', 
            'COINS_COURSE_REWARD', 
            'COINS_QUIZ_REWARD',
            'COINS_MEMORIZER_REWARD',
            'COINS_COACH_REWARD'
          ]
        }
      }
    });

    for (const s of settings) {
      if (s.key === 'COINS_NAME_REWARD') nameReward = s.value;
      if (s.key === 'COINS_PROFILE_REWARD') profileReward = s.value;
      if (s.key === 'COINS_VIDEO_REWARD') videoReward = s.value;
      if (s.key === 'COINS_COURSE_REWARD') courseReward = s.value;
      if (s.key === 'COINS_QUIZ_REWARD') quizReward = s.value;
      if (s.key === 'COINS_MEMORIZER_REWARD') memorizerReward = s.value;
      if (s.key === 'COINS_COACH_REWARD') coachReward = s.value;
    }
  } catch (e) {
    console.error("Failed to load gamification settings:", e);
  }

  async function saveGamificationSettings(fd: FormData) {
    "use server";
    const nameVal = fd.get('nameReward') as string;
    const profileVal = fd.get('profileReward') as string;
    const videoVal = fd.get('videoReward') as string;
    const courseVal = fd.get('courseReward') as string;
    const quizVal = fd.get('quizReward') as string;
    const memorizerVal = fd.get('memorizerReward') as string;
    const coachVal = fd.get('coachReward') as string;

    const data = [
      { key: 'COINS_NAME_REWARD', value: nameVal || "0" },
      { key: 'COINS_PROFILE_REWARD', value: profileVal || "0" },
      { key: 'COINS_VIDEO_REWARD', value: videoVal || "0" },
      { key: 'COINS_COURSE_REWARD', value: courseVal || "0" },
      { key: 'COINS_QUIZ_REWARD', value: quizVal || "0" },
      { key: 'COINS_MEMORIZER_REWARD', value: memorizerVal || "0" },
      { key: 'COINS_COACH_REWARD', value: coachVal || "0" }
    ];

    for (const item of data) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value }
      });
    }

    revalidatePath('/admin/gamification');
    revalidatePath('/profile');
  }

  return (
    <div style={{ paddingBottom: '60px', color: '#fff', fontFamily: 'var(--font-geist-sans), sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 className="admin-title" style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
            Gamification & Coin Rewards
          </h1>
          <p style={{ color: '#888', marginTop: '4px' }}>
            Configure the amount of Vyoma Coins rewarded to users for completing various engagement activities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin" className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none' }}>
            ← Admin Overview
          </Link>
        </div>
      </div>

      <div className="admin-grid-2">
        
        {/* CONFIGURATION FORM */}
        <div className="admin-card">
          <form action={saveGamificationSettings} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* Quest 1: Profile Name */}
            <div style={settingGroup}>
              <div style={infoPane}>
                <h3 style={settingTitle}>✏️ Display Name Reward</h3>
                <p style={settingDesc}>Coins awarded when a user sets/saves their display name for the first time.</p>
              </div>
              <div style={inputContainer}>
                <input required type="number" name="nameReward" defaultValue={nameReward} min="0" style={inputStyle} />
                <span style={inputBadge}>COINS</span>
              </div>
            </div>

            <hr style={divider} />

            {/* Quest 2: Full Profile Details */}
            <div style={settingGroup}>
              <div style={infoPane}>
                <h3 style={settingTitle}>📋 Full Profile Completion Reward</h3>
                <p style={settingDesc}>Coins awarded when all profile details (Photo, Location, Gender, Age, and Interests) are completed.</p>
              </div>
              <div style={inputContainer}>
                <input required type="number" name="profileReward" defaultValue={profileReward} min="0" style={inputStyle} />
                <span style={inputBadge}>COINS</span>
              </div>
            </div>

            <hr style={divider} />

            {/* Quest 3: Video Unit completion */}
            <div style={settingGroup}>
              <div style={infoPane}>
                <h3 style={settingTitle}>🎥 Video Completion Reward</h3>
                <p style={settingDesc}>Coins awarded to a user each time they finish watching a curriculum video/episode unit.</p>
              </div>
              <div style={inputContainer}>
                <input required type="number" name="videoReward" defaultValue={videoReward} min="0" style={inputStyle} />
                <span style={inputBadge}>COINS</span>
              </div>
            </div>

            <hr style={divider} />

            {/* Quest 4: Complete Course */}
            <div style={settingGroup}>
              <div style={infoPane}>
                <h3 style={settingTitle}>🎓 Entire Course Mastered Reward</h3>
                <p style={settingDesc}>Coins awarded when all curriculum units within a single course are fully completed.</p>
              </div>
              <div style={inputContainer}>
                <input required type="number" name="courseReward" defaultValue={courseReward} min="0" style={inputStyle} />
                <span style={inputBadge}>COINS</span>
              </div>
            </div>

            <hr style={divider} />

            {/* Quest 5: Attending & Passing Quiz */}
            <div style={settingGroup}>
              <div style={infoPane}>
                <h3 style={settingTitle}>📝 Quiz Passed Reward</h3>
                <p style={settingDesc}>Coins awarded to a user upon achieving the minimum passing score in a course assessment quiz.</p>
              </div>
              <div style={inputContainer}>
                <input required type="number" name="quizReward" defaultValue={quizReward} min="0" style={inputStyle} />
                <span style={inputBadge}>COINS</span>
              </div>
            </div>

            <hr style={divider} />

            {/* Quest 6: Shloka Memorizer Game Complete */}
            <div style={settingGroup}>
              <div style={infoPane}>
                <h3 style={settingTitle}>🧩 Shloka Memorizer Completion</h3>
                <p style={settingDesc}>Coins awarded to a user each time they correctly arrange a scrambled Shloka in the Memorizer Game.</p>
              </div>
              <div style={inputContainer}>
                <input required type="number" name="memorizerReward" defaultValue={memorizerReward} min="0" style={inputStyle} />
                <span style={inputBadge}>COINS</span>
              </div>
            </div>

            <hr style={divider} />

            {/* Quest 7: Recitation Coach Passed */}
            <div style={settingGroup}>
              <div style={infoPane}>
                <h3 style={settingTitle}>🎙️ Recitation Coach Mastery</h3>
                <p style={settingDesc}>Coins awarded when a user successfully passes a Speech Recitation attempt with target pronunciation accuracy.</p>
              </div>
              <div style={inputContainer}>
                <input required type="number" name="coachReward" defaultValue={coachReward} min="0" style={inputStyle} />
                <span style={inputBadge}>COINS</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '25px', textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary">
                💾 SAVE CONFIGURATIONS
              </button>
            </div>

          </form>
        </div>

        {/* SIDEBAR SUMMARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="admin-card" style={{ background: 'linear-gradient(135deg, rgba(242,100,34,0.05) 0%, rgba(15,22,36,0.6) 100%)', border: '1px solid rgba(242,100,34,0.2)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#ffaf85', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💡</span> Gamification Policy
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.6' }}>
              Coin rewards are given immediately upon completion. To prevent misuse, each reward is only granted once per user per target action (e.g. a user cannot gain infinite coins by repeatedly editing their name or course progress).
            </p>
          </div>

          <div className="admin-card">
            <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>⚙️ Current Wallet Multipliers</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Name Added</span>
                <span style={{ color: '#46d369', fontWeight: 'bold' }}>+{nameReward} Coins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Full Profile</span>
                <span style={{ color: '#46d369', fontWeight: 'bold' }}>+{profileReward} Coins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Video Watched</span>
                <span style={{ color: '#46d369', fontWeight: 'bold' }}>+{videoReward} Coins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Course Completed</span>
                <span style={{ color: '#46d369', fontWeight: 'bold' }}>+{courseReward} Coins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Quiz Passed</span>
                <span style={{ color: '#46d369', fontWeight: 'bold' }}>+{quizReward} Coins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Shloka Memorizer</span>
                <span style={{ color: '#46d369', fontWeight: 'bold' }}>+{memorizerReward} Coins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Recitation Coach</span>
                <span style={{ color: '#46d369', fontWeight: 'bold' }}>+{coachReward} Coins</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

// Styling Constants
const settingGroup: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px'
};

const infoPane: React.CSSProperties = {
  flex: 1
};

const settingTitle: React.CSSProperties = {
  margin: '0 0 5px 0',
  fontSize: '1.1rem',
  fontWeight: 800,
  color: '#fff'
};

const settingDesc: React.CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#888',
  lineHeight: '1.4'
};

const inputContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(15, 22, 36, 0.85)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  overflow: 'hidden',
  width: '180px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  color: '#fff',
  padding: '12px 15px',
  outline: 'none',
  fontSize: '1rem',
  fontWeight: 'bold',
  textAlign: 'right'
};

const inputBadge: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  color: '#888',
  padding: '12px 15px',
  fontSize: '0.75rem',
  fontWeight: 800,
  borderLeft: '1px solid rgba(255,255,255,0.1)'
};

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  margin: 0
};
