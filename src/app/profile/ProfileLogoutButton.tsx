"use client";

import { useState } from 'react';
import LogoutConfirmationModal from '@/app/components/LogoutConfirmationModal';
import { logoutUser } from '@/app/actions/auth';
import { useGlobalPlayer } from '@/app/components/GlobalPlayerProvider';

/**
 * Logout control shown on the Profile page. The NavBar hides its own Logout on /profile,
 * so this is the single logout entry point there. Uses the same confirmation modal and
 * server action as the NavBar.
 */
export default function ProfileLogoutButton() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { stopEpisode } = useGlobalPlayer();

  return (
    <>
      <button
        type="button"
        onClick={() => setShowLogoutModal(true)}
        style={{ width: '100%', border: '1px solid rgba(255,0,0,0.2)', background: 'rgba(255,0,0,0.1)', color: '#ff4444', textAlign: 'center', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
      >
        🔐 SECURE LOG OUT
      </button>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false);
          stopEpisode(); // don't let the mini player keep playing after logout
          await logoutUser();
        }}
      />
    </>
  );
}
