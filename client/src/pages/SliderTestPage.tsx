import React, { useState } from 'react';
import { PostJobPage } from './industry/PostJobPage';
import { AvatarUploadModal } from '../components/profile/AvatarUploadModal';

export const SliderTestPage: React.FC = () => {
  const [isAvatarOpen, setIsAvatarOpen] = useState(true);

  return (
    <div className="p-8 bg-[#0b0f19] text-white min-h-screen">
      <h1 className="text-xl font-bold mb-6">Slider Accessibility Verification Harness</h1>

      <section id="post-job-section" className="mb-12 border border-slate-800 p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-4 text-cyan-400">PostJobPage Sliders</h2>
        <PostJobPage />
      </section>

      <section id="avatar-modal-section" className="border border-slate-800 p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-4 text-bridge-teal">AvatarUploadModal</h2>
        <button
          id="open-avatar-modal-btn"
          onClick={() => setIsAvatarOpen(true)}
          className="px-4 py-2 bg-teal-600 rounded text-sm mb-4"
        >
          Open Avatar Modal
        </button>
        <AvatarUploadModal
          isOpen={isAvatarOpen}
          onClose={() => setIsAvatarOpen(false)}
          onAvatarUpdated={() => {}}
        />
      </section>
    </div>
  );
};
