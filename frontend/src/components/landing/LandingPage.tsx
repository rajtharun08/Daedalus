import React from 'react';
import { HeroNetworkPattern } from './HeroNetworkPattern';
import { HeroMasterpiece } from './HeroMasterpiece';
import { HackathonComparison } from './HackathonComparison';
import { BentoGrid } from './BentoGrid';
import { TechDeepDiveFAQ } from './TechDeepDiveFAQ';
import { ClimaxCTA } from './ClimaxCTA';
import { MasterpieceFooter } from './MasterpieceFooter';

interface Props {
  onStartOnboarding: () => void;
  onLaunchTemplate: (title: string, prompt: string) => void;
  onOpenDocs: () => void;
  onOpenChangelog: () => void;
  onOpenStatus: () => void;
  onOpenCommandPalette: () => void;
}

export const LandingPage: React.FC<Props> = ({
  onStartOnboarding,
  onLaunchTemplate,
  onOpenDocs,
  onOpenChangelog,
  onOpenStatus,
  onOpenCommandPalette,
}) => {
  return (
    <div className="w-full space-y-24 py-4 animate-fadeIn relative">
      {/* Visual Pattern: Tech Constellation / Mesh Header */}
      <HeroNetworkPattern />

      {/* Landing Page Content */}
      <div className="relative z-10 space-y-24">
        {/* 1. Masterpiece Hero with Live Interactive Cockpit */}
        <HeroMasterpiece
          onStartOnboarding={onStartOnboarding}
          onLaunchTemplate={onLaunchTemplate}
          onOpenDocs={onOpenDocs}
          onOpenCommandPalette={onOpenCommandPalette}
        />

        {/* 2. Hackathon Reality Check: Chaos vs. Velocity (Before vs. After Interactive Comparison) */}
        <HackathonComparison />

        {/* 3. Bento Grid of 4 Interactive Micro-Applications */}
        <BentoGrid />

        {/* 4. Deep-Dive Architecture & Developer FAQ */}
        <TechDeepDiveFAQ />

        {/* 5. Climax Magnetic Command Deck CTA */}
        <ClimaxCTA onStartOnboarding={onStartOnboarding} />

        {/* 6. Authoritative Developer-Grade Footer with 100% Functional Redirections */}
        <MasterpieceFooter
          onOpenDocs={onOpenDocs}
          onOpenChangelog={onOpenChangelog}
          onOpenStatus={onOpenStatus}
        />
      </div>
    </div>
  );
};
