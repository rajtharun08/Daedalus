import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Crown,
  Clock,
  GitBranch,
  ArrowUpRight,
  Zap,
  Check,
  Trash2,
  Cpu,
  Copy,
  ExternalLink,
  Play,
  Share2,
  AlertCircle,
  Plus,
  Settings,
  X,
  UserCheck,
  UserX,
  MessageSquare,
  Activity,
  Edit3,
  ArrowLeft,
  Search,
  Filter,
  Terminal,
  ArrowRight,
  Mail,
  Send,
  Inbox,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import {
  fetchTeamMatch,
  scanSkills,
  fetchTeamInvitations,
  sendTeamInvitation,
  respondTeamInvitation,
  cancelTeamInvitation,
  TeamInvitation,
} from '../../services/api';
import { MagneticButton } from '../common/MagneticButton';
import { GlassCard } from '../common/GlassCard';
import { triggerConfettiBurst } from '../common/ConfettiBurst';
import { ActiveSquad, Project, User } from '../../types';

interface Props {
  currentUser?: User | null;
  onNavigateToWorkspace?: () => void;
  activeSquad?: ActiveSquad | null;
  onSelectActiveSquad?: (squad: ActiveSquad | null) => void;
  activeProject?: Project | null;
}

const DOMAINS = ['Frontend', 'Backend', 'Database', 'DevOps', 'AI'];
const CENTER_X = 110;
const CENTER_Y = 110;
const RADIUS = 72;

function getCoordinates(index: number, value: number, radius = RADIUS) {
  const angleDeg = index * 72 - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  const r = radius * Math.max(0.12, Math.min(1.0, value));
  return {
    x: CENTER_X + r * Math.cos(angleRad),
    y: CENTER_Y + r * Math.sin(angleRad),
  };
}

function getLabelCoordinates(index: number) {
  const angleDeg = index * 72 - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  const r = RADIUS + 20;
  return {
    x: CENTER_X + r * Math.cos(angleRad),
    y: CENTER_Y + r * Math.sin(angleRad),
  };
}

export interface JoinRequest {
  id: string;
  applicant: {
    id: string;
    full_name: string;
    github_username: string;
    avatar_url: string;
    timezone: string;
    active_branch: string;
    role: string;
    skills: string[];
  };
  applied_at: string;
  note: string;
  added_synergy: number;
  projected_team_synergy: number;
  impact_summary: string;
  stats: {
    commit_velocity: string;
    top_language: string;
    experience_level: string;
  };
}

export interface Squad {
  id: string;
  name: string;
  track: string;
  mission: string;
  maxTeamSize: number;
  tags: string[];
  leader: {
    name: string;
    handle: string;
    avatar_url: string;
  };
  initialMemberIds: string[];
  joinRequests: JoinRequest[];
  defaultCoverage: Record<string, number>;
  defaultSynergy: number;
}

const SEED_JOIN_REQUESTS: JoinRequest[] = [
  {
    id: 'req_devon',
    applicant: {
      id: 'user_devon',
      full_name: 'Devon Vance',
      github_username: 'devon-ops',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=devon-ops',
      timezone: 'UTC-04:00 (EDT)',
      active_branch: 'feat/k8s-manifests',
      role: 'DevOps & Infrastructure Lead',
      skills: ['Docker & Compose', 'GitHub Actions CI', 'Kubernetes', 'AWS Lambda'],
    },
    applied_at: '3m ago',
    note: 'Noticed your squad has strong Backend & AI but needs a dedicated DevOps engineer. I can handle CI/CD, Dockerization, and cloud deployment.',
    added_synergy: 18,
    projected_team_synergy: 96,
    impact_summary: 'Fills DevOps stack gap (45% -> 92%)',
    stats: {
      commit_velocity: 'Active Contributor',
      top_language: 'HCL / Docker / Python',
      experience_level: 'Infrastructure & CI',
    },
  },
  {
    id: 'req_elena',
    applicant: {
      id: 'user_elena',
      full_name: 'Elena Rostova',
      github_username: 'elena-ai',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=elena-ai',
      timezone: 'UTC+01:00 (CET)',
      active_branch: 'feat/vector-search',
      role: 'AI & Data Specialist',
      skills: ['RAG Architectures', 'PyTorch & Embeddings', 'Vector Search', 'FastAPI'],
    },
    applied_at: '11m ago',
    note: 'Looking for a squad building AI/LLM apps! I have experience writing custom embedding pipelines and real-time semantic retrieval.',
    added_synergy: 12,
    projected_team_synergy: 92,
    impact_summary: 'Strengthens AI & Database (75% -> 94%)',
    stats: {
      commit_velocity: 'Core Contributor',
      top_language: 'Python / CUDA',
      experience_level: 'ML & Data Systems',
    },
  },
];

const DEFAULT_SQUADS: Squad[] = [
  {
    id: 'squad-crdt',
    name: 'Autonomous CRDT Whiteboard Squad',
    track: 'Full-Stack & Realtime Systems',
    mission: 'Building a sub-10ms conflict-free collaborative whiteboard with CRDT sync, WebSockets, and Redis pub/sub.',
    maxTeamSize: 4,
    tags: ['CRDT', 'React', 'FastAPI', 'WebSockets'],
    leader: {
      name: 'Alex Rivera',
      handle: 'alex-rivera',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex-rivera',
    },
    initialMemberIds: ['user_1', 'user_2'],
    joinRequests: SEED_JOIN_REQUESTS,
    defaultCoverage: { Frontend: 0.85, Backend: 0.9, Database: 0.8, DevOps: 0.45, AI: 0.75 },
    defaultSynergy: 85,
  },
  {
    id: 'squad-defi',
    name: 'Flash-Loan Arbitrage Core',
    track: 'Web3 & Algorithmic Finance',
    mission: 'Sub-second DEX liquidity pool scanner executing atomic flash loans via Uniswap V3 and Sushiswap.',
    maxTeamSize: 3,
    tags: ['Solidity', 'FastAPI', 'Web3.py', 'RPC'],
    leader: {
      name: 'Marcus Vance',
      handle: 'marcus-vance',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=marcus-vance',
    },
    initialMemberIds: ['user_3', 'user_4'],
    joinRequests: [],
    defaultCoverage: { Frontend: 0.65, Backend: 0.95, Database: 0.85, DevOps: 0.8, AI: 0.9 },
    defaultSynergy: 91,
  },
  {
    id: 'squad-medrag',
    name: 'Clinical Trials RAG Pipeline',
    track: 'AI & Healthcare Intelligence',
    mission: 'HIPAA-compliant medical document retrieval engine with 384-D vector embeddings and audit citations.',
    maxTeamSize: 4,
    tags: ['Vector Search', 'FastAPI', 'PyTorch', 'PostgreSQL'],
    leader: {
      name: 'Elena Rostova',
      handle: 'elena-ai',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=elena-ai',
    },
    initialMemberIds: ['user_1', 'user_4'],
    joinRequests: [],
    defaultCoverage: { Frontend: 0.7, Backend: 0.9, Database: 0.95, DevOps: 0.5, AI: 0.95 },
    defaultSynergy: 88,
  },
];

export const TeamRoster: React.FC<Props> = ({
  currentUser,
  onNavigateToWorkspace,
  activeSquad: globalActiveSquad,
  onSelectActiveSquad,
  activeProject,
}) => {
  const creatorUser = useMemo(() => {
    if (currentUser) return currentUser;
    const saved = localStorage.getItem('daedalus_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      id: 'user_1',
      full_name: 'Alex Chen',
      github_username: 'alexc-dev',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=alexc-dev',
    };
  }, [currentUser]);
  const handleLaunchSprintWithSquad = (targetSquad: Squad, customTeamIds?: string[]) => {
    const memberIds = customTeamIds && customTeamIds.length > 0
      ? customTeamIds
      : targetSquad.initialMemberIds;

    const squadObj: ActiveSquad = {
      id: targetSquad.id,
      name: targetSquad.id === activeSquad?.id ? teamName : targetSquad.name,
      track: targetSquad.track,
      mission: targetSquad.mission,
      memberIds: memberIds,
      members: matchData?.current_team || [],
    };

    if (onSelectActiveSquad) {
      onSelectActiveSquad(squadObj);
    }
    triggerConfettiBurst();
    if (onNavigateToWorkspace) {
      onNavigateToWorkspace();
    }
  };
  // Squads state
  const [squads, setSquads] = useState<Squad[]>(() => {
    const saved = localStorage.getItem('daedalus_squads_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SQUADS;
  });

  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryTrackFilter, setDirectoryTrackFilter] = useState('all');

  // Active Squad Deck state
  const activeSquad = useMemo(() => {
    if (!selectedSquadId) return null;
    return squads.find((s) => s.id === selectedSquadId) || squads[0];
  }, [selectedSquadId, squads]);

  const [matchData, setMatchData] = useState<any>(null);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [copiedRoster, setCopiedRoster] = useState(false);

  // Active Squad configuration state
  const [teamName, setTeamName] = useState('Autonomous CRDT Whiteboard Squad');
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Inbound join requests for active squad
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  // Apply to join modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applySquadTarget, setApplySquadTarget] = useState<Squad | null>(null);
  const [applyName, setApplyName] = useState('');
  const [applyHandle, setApplyHandle] = useState('');
  const [applyNote, setApplyNote] = useState('');
  const [applyRole, setApplyRole] = useState('DevOps');

  // Create Squad Modal
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadTrack, setNewSquadTrack] = useState('AI & Machine Learning');
  const [newSquadCapacity, setNewSquadCapacity] = useState(4);
  const [newSquadTags, setNewSquadTags] = useState('FastAPI, React, Docker');
  const [squadTagList, setSquadTagList] = useState<string[]>(['FastAPI', 'React', 'Docker']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [newSquadMission, setNewSquadMission] = useState('');

  // Custom GitHub invite
  const [customHandle, setCustomHandle] = useState('');
  const [isScanningCustom, setIsScanningCustom] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Hovered applicant for live impact simulation
  const [hoveredCandidate, setHoveredCandidate] = useState<any | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Team Invitations (giving request to user & receiving team invitations)
  const [receivedInvitations, setReceivedInvitations] = useState<TeamInvitation[]>([]);
  const [outboundInvitations, setOutboundInvitations] = useState<TeamInvitation[]>([]);
  const [directoryViewTab, setDirectoryViewTab] = useState<'directory' | 'invitations'>('directory');

  // Send Squad Invitation to Developer Modal state
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false);
  const [inviteTargetUser, setInviteTargetUser] = useState<{
    id?: string;
    full_name: string;
    github_username: string;
    avatar_url: string;
    skills?: string[];
    added_synergy?: number;
  } | null>(null);
  const [inviteRole, setInviteRole] = useState('AI & Data Specialist');
  const [invitePitchNote, setInvitePitchNote] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Refresh invitations from backend API
  const refreshInvitations = async () => {
    try {
      const inboundRes = await fetchTeamInvitations({ target_username: 'alexc-dev' });
      if (inboundRes && inboundRes.invitations) {
        setReceivedInvitations(inboundRes.invitations);
      }
      const outboundRes = await fetchTeamInvitations();
      if (outboundRes && outboundRes.invitations) {
        setOutboundInvitations(outboundRes.invitations);
      }
    } catch (err) {
      console.error('Failed to load team invitations:', err);
    }
  };

  useEffect(() => {
    refreshInvitations();
  }, [selectedSquadId]);

  // Open Invite Developer Modal
  const handleOpenInviteUserModal = (user: {
    id?: string;
    full_name: string;
    github_username: string;
    avatar_url: string;
    skills?: string[];
    added_synergy?: number;
  }) => {
    setInviteTargetUser(user);
    let suggestedRole = 'Full-Stack Engineer';
    const skillsStr = (user.skills || []).join(' ').toLowerCase();
    if (/devops|docker|cloud|k8s|ci/i.test(skillsStr)) {
      suggestedRole = 'DevOps & Infrastructure Lead';
    } else if (/ai|vector|llm|ml|python/i.test(skillsStr)) {
      suggestedRole = 'AI & Data Specialist';
    } else if (/react|frontend|ui|tailwind/i.test(skillsStr)) {
      suggestedRole = 'Frontend Engineer';
    } else if (/backend|fastapi|database|postgres/i.test(skillsStr)) {
      suggestedRole = 'Backend Architect';
    }
    setInviteRole(suggestedRole);
    setInvitePitchNote(
      `Hey ${user.full_name.split(' ')[0]}! We saw your expertise in ${(user.skills || ['modern software'])[0]} and want to invite you to join ${teamName} as our ${suggestedRole} for the upcoming sprint!`
    );
    setIsInviteUserModalOpen(true);
  };

  // Send the invitation to user
  const handleSendSquadInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTargetUser) return;
    setIsSendingInvite(true);
    try {
      const payload = {
        team_id: activeSquad?.id || 'squad_default',
        squad_name: teamName,
        target_username: inviteTargetUser.github_username,
        target_user_id: inviteTargetUser.id,
        target_user_name: inviteTargetUser.full_name,
        target_avatar_url: inviteTargetUser.avatar_url,
        role: inviteRole,
        pitch_note: invitePitchNote,
        projected_synergy: inviteTargetUser.added_synergy || 18,
        invited_by_name: 'Alex Chen',
        invited_by_handle: 'alexc-dev',
      };
      const res = await sendTeamInvitation(payload);
      if (res && res.invitation) {
        setOutboundInvitations((prev) => [res.invitation, ...prev]);
        triggerConfettiBurst();
        setInviteSuccess(`Invitation sent to @${inviteTargetUser.github_username} to join ${teamName}!`);
        setIsInviteUserModalOpen(false);
        setTimeout(() => setInviteSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Accept a received invitation
  const handleAcceptReceivedInvitation = async (inv: TeamInvitation) => {
    try {
      await respondTeamInvitation(inv.id, 'accept');
      setReceivedInvitations((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: 'ACCEPTED' as const } : i))
      );
      triggerConfettiBurst();
      setInviteSuccess(`You accepted the invitation and joined ${inv.squad_name}!`);
      const targetSquad = squads.find((s) => s.id === inv.team_id || s.name === inv.squad_name);
      if (targetSquad) {
        setSelectedSquadId(targetSquad.id);
        setDirectoryViewTab('directory');
      }
      setTimeout(() => setInviteSuccess(null), 4500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to accept invitation');
    }
  };

  // Decline a received invitation
  const handleDeclineReceivedInvitation = async (invId: string) => {
    try {
      await respondTeamInvitation(invId, 'decline');
      setReceivedInvitations((prev) =>
        prev.map((i) => (i.id === invId ? { ...i, status: 'DECLINED' as const } : i))
      );
    } catch (err: any) {
      console.error(err);
    }
  };

  // Cancel/revoke an outbound invitation sent by this squad
  const handleCancelOutboundInvitation = async (invId: string) => {
    try {
      await cancelTeamInvitation(invId);
      setOutboundInvitations((prev) => prev.filter((i) => i.id !== invId));
    } catch (err: any) {
      console.error(err);
    }
  };

  // Load team data whenever active squad changes
  useEffect(() => {
    if (!activeSquad) return;
    setTeamName(activeSquad.name);
    setMaxTeamSize(activeSquad.maxTeamSize);
    setJoinRequests(activeSquad.joinRequests);
    loadTeamData(activeSquad.initialMemberIds);
  }, [activeSquad]);

  const loadTeamData = (ids?: string[]) => {
    setIsLoading(true);
    const idParam = ids && ids.length > 0 ? ids.join(',') : undefined;
    fetchTeamMatch(idParam)
      .then((data) => {
        setMatchData(data);
        if (ids) {
          setTeamIds(ids);
        } else if (data.current_team) {
          setTeamIds(data.current_team.map((u: any) => u.id));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const handleUpdateTeamSettings = (name: string, size: number) => {
    setTeamName(name);
    setMaxTeamSize(size);
    if (activeSquad) {
      setSquads((prev) =>
        prev.map((s) => (s.id === activeSquad.id ? { ...s, name, maxTeamSize: size } : s))
      );
    }
    setIsSettingsOpen(false);
    triggerConfettiBurst();
  };

  // Team Leader accepts applicant
  const handleAcceptRequest = (req: JoinRequest) => {
    if (teamIds.length >= maxTeamSize) {
      alert(`Team is already at capacity (${maxTeamSize}/${maxTeamSize} members).`);
      return;
    }

    const updated = [...teamIds, req.applicant.id];
    setTeamIds(updated);
    loadTeamData(updated);
    setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    triggerConfettiBurst();
    setInviteSuccess(`Accepted ${req.applicant.full_name} (@${req.applicant.github_username}) into the squad!`);
    setTimeout(() => setInviteSuccess(null), 4000);
  };

  // Team Leader declines applicant
  const handleDeclineRequest = (reqId: string) => {
    setJoinRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  // Submit join request
  const handleSubmitJoinRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyHandle.trim() || !applyName.trim()) return;

    const targetSquad = applySquadTarget || activeSquad;
    if (!targetSquad) return;

    const newReq: JoinRequest = {
      id: 'req_' + Date.now(),
      applicant: {
        id: 'user_' + Date.now(),
        full_name: applyName.trim(),
        github_username: applyHandle.trim().replace('@', ''),
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${applyHandle.trim()}`,
        timezone: 'UTC-04:00 (EDT)',
        active_branch: `feat/${applyHandle.trim()}-onboard`,
        role: `${applyRole.toUpperCase()} SPECIALIST`,
        skills: [`${applyRole} Core`, 'Full-Stack Integration', 'Git Flow'],
      },
      applied_at: 'Just now',
      note: applyNote.trim() || `Excited to join ${targetSquad.name} and execute during the sprint!`,
      added_synergy: 12,
      projected_team_synergy: Math.min(100, (targetSquad.defaultSynergy || 85) + 12),
      impact_summary: `Brings ${applyRole} engineering capability`,
      stats: {
        commit_velocity: 'Active (20+ commits/week)',
        top_language: applyRole === 'Frontend' ? 'TypeScript/React' : 'Python/FastAPI',
        experience_level: 'Hackathon Builder',
      },
    };

    setSquads((prev) =>
      prev.map((s) => (s.id === targetSquad.id ? { ...s, joinRequests: [newReq, ...s.joinRequests] } : s))
    );

    if (activeSquad && activeSquad.id === targetSquad.id) {
      setJoinRequests((prev) => [newReq, ...prev]);
    }

    setIsApplyModalOpen(false);
    setApplyName('');
    setApplyHandle('');
    setApplyNote('');
    triggerConfettiBurst();
    setInviteSuccess(`Your join request has been sent to ${targetSquad.name} for review!`);
    setTimeout(() => setInviteSuccess(null), 4000);
  };

  // Create a new squad
  const handleCreateSquad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;

    const finalTags = squadTagList.length > 0
      ? squadTagList
      : newSquadTags.split(',').map((t) => t.trim()).filter(Boolean);

    const creatorName = creatorUser.full_name || 'Alex Chen';
    const creatorHandle = creatorUser.github_username || 'alexc-dev';
    const creatorAvatar = creatorUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${creatorHandle}`;
    const creatorId = creatorUser.id || 'user_1';

    const newSquad: Squad = {
      id: 'squad_' + Date.now(),
      name: newSquadName.trim(),
      track: newSquadTrack,
      mission: newSquadMission.trim() || `Building a high-velocity solution in ${newSquadTrack}.`,
      maxTeamSize: newSquadCapacity,
      tags: finalTags,
      leader: {
        name: `${creatorName} (You)`,
        handle: creatorHandle,
        avatar_url: creatorAvatar,
      },
      initialMemberIds: [creatorId],
      joinRequests: [],
      defaultCoverage: { Frontend: 0.9, Backend: 0.85, Database: 0.8, DevOps: 0.5, AI: 0.7 },
      defaultSynergy: 82,
    };

    const updatedSquads = [newSquad, ...squads];
    setSquads(updatedSquads);
    localStorage.setItem('daedalus_squads_list', JSON.stringify(updatedSquads));

    // Reset modal & immediately open this squad's deck
    setIsCreateSquadOpen(false);
    setNewSquadName('');
    setNewSquadMission('');
    setSelectedSquadId(newSquad.id);
    triggerConfettiBurst();
  };

  const handleAddTeammate = (userId: string, userName: string) => {
    if (teamIds.length >= maxTeamSize) {
      alert(`Team is already at capacity (${maxTeamSize}/${maxTeamSize} members).`);
      return;
    }
    const updated = [...teamIds, userId];
    setTeamIds(updated);
    loadTeamData(updated);
    triggerConfettiBurst();
    setInviteSuccess(`Drafted ${userName} into the Hackathon Squad!`);
    setTimeout(() => setInviteSuccess(null), 3500);
  };

  const handleRemoveTeammate = (userId: string) => {
    if (teamIds.length <= 1) return;
    const updated = teamIds.filter((id) => id !== userId);
    setTeamIds(updated);
    loadTeamData(updated);
  };

  // Live invite any GitHub user
  const handleScanAndDraftCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHandle.trim()) return;
    if (teamIds.length >= maxTeamSize) {
      alert(`Team is at maximum capacity (${maxTeamSize}/${maxTeamSize}).`);
      return;
    }

    setIsScanningCustom(true);
    setScanError(null);

    try {
      const res = await scanSkills(customHandle.trim());
      const newUser = res.user;
      const updated = [...teamIds, newUser.id];
      setTeamIds(updated);
      loadTeamData(updated);
      triggerConfettiBurst();
      setInviteSuccess(`Successfully scanned and added @${customHandle} to squad!`);
      setCustomHandle('');
      setIsScanningCustom(false);
      setTimeout(() => setInviteSuccess(null), 4000);
    } catch (err: any) {
      setScanError('Could not find GitHub user. Try another username.');
      setIsScanningCustom(false);
    }
  };

  const currentTeam = matchData?.current_team || [];
  const coverage = matchData?.coverage || activeSquad?.defaultCoverage || {
    Frontend: 0.85,
    Backend: 0.9,
    Database: 0.8,
    DevOps: 0.45,
    AI: 0.75,
  };
  const overallSynergy = matchData?.overall_synergy || activeSquad?.defaultSynergy || 85;
  const recommendations = matchData?.recommended_teammates || [];

  const isFull = currentTeam.length >= maxTeamSize;

  // Filtered recommendations
  const filteredRecommendations = useMemo(() => {
    if (filterCategory === 'all') return recommendations;
    if (filterCategory === 'boost')
      return recommendations.filter((r: any) => r.added_synergy > 5);
    if (filterCategory === 'devops')
      return recommendations.filter((r: any) =>
        r.user.skills.some((s: string) => /devops|docker|cloud|infra|ci/i.test(s))
      );
    if (filterCategory === 'ai')
      return recommendations.filter((r: any) =>
        r.user.skills.some((s: string) => /ai|vector|llm|python|rag/i.test(s))
      );
    if (filterCategory === 'frontend')
      return recommendations.filter((r: any) =>
        r.user.skills.some((s: string) => /react|tailwind|frontend|ui/i.test(s))
      );
    return recommendations;
  }, [recommendations, filterCategory]);

  // Export roster to clipboard
  const handleCopyRoster = () => {
    const text = [
      `${teamName.toUpperCase()} - ENGINEERING SQUAD ROSTER`,
      `Capacity: ${currentTeam.length} / ${maxTeamSize} Members`,
      `Stack Coverage: ${overallSynergy}%`,
      ``,
      ...currentTeam.map(
        (m: any, idx: number) =>
          `${idx + 1}. ${m.full_name} (@${m.github_username}) - ${m.skills.slice(0, 2).join(', ')}`
      ),
      ``,
      `Stack Coverage: Frontend (${Math.round((coverage.Frontend || 0) * 100)}%), Backend (${Math.round((coverage.Backend || 0) * 100)}%), Database (${Math.round((coverage.Database || 0) * 100)}%), DevOps (${Math.round((coverage.DevOps || 0) * 100)}%), AI (${Math.round((coverage.AI || 0) * 100)}%)`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedRoster(true);
    setTimeout(() => setCopiedRoster(false), 2500);
  };

  // Role Badges
  const getRoleBadge = (index: number) => {
    const roles = [
      { name: 'Core Architect (Lead)', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
      { name: 'Frontend Engineer', color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
      { name: 'AI & Data Specialist', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
      { name: 'DevOps & Infrastructure Lead', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
      { name: 'Full-Stack Engineer', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    ];
    return roles[index % roles.length];
  };

  // Compute Current Spider Graph Points
  const currentRadarPoints = useMemo(() => {
    return DOMAINS.map((domain, idx) => {
      const val = coverage[domain] || 0.5;
      const { x, y } = getCoordinates(idx, val);
      return `${x},${y}`;
    }).join(' ');
  }, [coverage]);

  // Projected Spider Graph Points (Simulated on Hover)
  const projectedRadarPoints = useMemo(() => {
    if (!hoveredCandidate) return null;

    let projectedCoverage = { ...coverage };
    if (hoveredCandidate.simulated_coverage) {
      projectedCoverage = hoveredCandidate.simulated_coverage;
    } else if (hoveredCandidate.applicant) {
      const role = hoveredCandidate.applicant.role;
      if (/DEVOPS/i.test(role)) {
        projectedCoverage.DevOps = Math.min(1.0, (projectedCoverage.DevOps || 0.4) + 0.45);
      } else if (/AI/i.test(role)) {
        projectedCoverage.AI = Math.min(1.0, (projectedCoverage.AI || 0.6) + 0.3);
      } else if (/FRONTEND|INTERFACE/i.test(role)) {
        projectedCoverage.Frontend = Math.min(1.0, (projectedCoverage.Frontend || 0.7) + 0.25);
      } else {
        projectedCoverage.Backend = Math.min(1.0, (projectedCoverage.Backend || 0.7) + 0.25);
      }
    }

    return DOMAINS.map((domain, idx) => {
      const val = projectedCoverage[domain] || 0.6;
      const { x, y } = getCoordinates(idx, val);
      return `${x},${y}`;
    }).join(' ');
  }, [coverage, hoveredCandidate]);

  // Filtered Squads for Directory
  const filteredSquads = useMemo(() => {
    return squads.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
        s.mission.toLowerCase().includes(directorySearch.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(directorySearch.toLowerCase()));

      const matchesTrack =
        directoryTrackFilter === 'all' ||
        s.track.toLowerCase().includes(directoryTrackFilter.toLowerCase());

      return matchesSearch && matchesTrack;
    });
  }, [squads, directorySearch, directoryTrackFilter]);

  // =========================================================================
  // VIEW 1: SQUADS DIRECTORY (Shown when no specific squad is selected)
  // =========================================================================
  if (!selectedSquadId) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
        {/* Top Header Bar with Create Squad Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-space-950 border border-white/10 text-xs font-mono text-slate-300">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>HACKATHON SQUAD DIRECTORY</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-sans tracking-tight">
              Sprint Squads & Matchmaking
            </h1>
            <p className="text-xs text-slate-400 font-sans max-w-xl">
              Discover active sprint teams, inspect missing competencies, or create your own squad to recruit teammates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateSquadOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white text-space-950 font-sans text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-space-950" />
              <span>Create Squad</span>
            </button>
          </div>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setDirectoryViewTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              directoryViewTab === 'directory'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'bg-space-950 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Squads Directory</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                directoryViewTab === 'directory' ? 'bg-zinc-200 text-zinc-900 font-bold' : 'bg-white/10 text-slate-400'
              }`}
            >
              {squads.length}
            </span>
          </button>

          <button
            onClick={() => setDirectoryViewTab('invitations')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer relative ${
              directoryViewTab === 'invitations'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'bg-space-950 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>My Received Invitations</span>
            {receivedInvitations.filter((i) => i.status === 'PENDING').length > 0 ? (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-400 text-zinc-950 animate-pulse">
                {receivedInvitations.filter((i) => i.status === 'PENDING').length} New
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/10 text-slate-400">
                {receivedInvitations.length}
              </span>
            )}
          </button>
        </div>

        {directoryViewTab === 'invitations' ? (
          /* Received Invitations List */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white font-sans">
                  Invitations Received by You ({receivedInvitations.length})
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Logged in as <span className="text-cyan-400 font-semibold">@alexc-dev</span>
              </span>
            </div>

            {receivedInvitations.length === 0 ? (
              <div className="p-12 rounded-3xl bg-space-950 border border-white/5 text-center space-y-3">
                <Mail className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-sm font-sans font-bold text-white">No Team Invitations Pending</div>
                <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
                  When other squad leaders invite you to join their hackathon team, their requests will appear here with complete role details.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {receivedInvitations.map((inv) => (
                  <GlassCard
                    key={inv.id}
                    className="p-6 border border-white/10 hover:border-cyan-500/40 flex flex-col justify-between space-y-4 bg-space-950/70 transition-all"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                            INVITATION TO JOIN
                          </span>
                          <h3 className="text-lg font-bold font-sans text-white mt-1.5">{inv.squad_name}</h3>
                          <div className="text-[11px] font-mono text-slate-400">
                            Invited by <span className="text-white font-semibold">{inv.invited_by_name}</span> (@{inv.invited_by_handle}) • {inv.created_at}
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold shrink-0">
                          +{inv.projected_synergy}% Fit
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-space-900 border border-white/5 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Offered Role:</span>
                        <span className="text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
                          {inv.role}
                        </span>
                      </div>

                      <p className="text-xs font-sans text-slate-300 italic bg-space-900/60 p-3 rounded-xl border border-white/5 leading-relaxed">
                        "{inv.pitch_note}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        inv.status === 'ACCEPTED'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : inv.status === 'DECLINED'
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-amber-300 bg-amber-500/10'
                      }`}>
                        Status: {inv.status}
                      </span>

                      {inv.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeclineReceivedInvitation(inv.id)}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptReceivedInvitation(inv)}
                            className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 text-xs font-mono transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Accept & Join Squad</span>
                          </button>
                        </div>
                      ) : inv.status === 'ACCEPTED' ? (
                        <button
                          onClick={() => {
                            const target = squads.find((s) => s.id === inv.team_id || s.name === inv.squad_name);
                            if (target) setSelectedSquadId(target.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-mono hover:bg-cyan-500/30 transition-colors"
                        >
                          Open Squad Deck &rarr;
                        </button>
                      ) : null}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search squads by name, tech or mission..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-space-950 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                {['all', 'Realtime', 'Web3', 'AI', 'Full-Stack'].map((track) => (
                  <button
                    key={track}
                    onClick={() => setDirectoryTrackFilter(track)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                      directoryTrackFilter === track
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                        : 'bg-space-950 border border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {track === 'all' ? 'All Tracks' : track}
                  </button>
                ))}
              </div>
            </div>

            {/* Squad Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSquads.map((squad) => {
            const filledCount = squad.initialMemberIds.length;
            const isFullSquad = filledCount >= squad.maxTeamSize;

            return (
              <GlassCard
                key={squad.id}
                className="p-6 border border-white/10 hover:border-cyan-500/40 flex flex-col justify-between space-y-5 transition-all group"
              >
                <div className="space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-white/5 text-purple-300 border border-white/10 font-semibold">
                        {squad.track}
                      </span>
                      {globalActiveSquad?.id === squad.id && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          ACTIVE SQUAD
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      {filledCount} / {squad.maxTeamSize} {squad.maxTeamSize === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>

                  {/* Squad Name */}
                  <h3 className="text-lg font-bold font-sans text-white group-hover:text-cyan-300 transition-colors">
                    {squad.name}
                  </h3>

                  {/* Mission */}
                  <p className="text-xs font-sans text-slate-400 line-clamp-2 leading-relaxed">
                    {squad.mission}
                  </p>

                  {/* Leader Info */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <div className="relative">
                      <img
                        src={squad.leader.avatar_url}
                        alt={squad.leader.name}
                        className="w-7 h-7 rounded-lg border border-white/10 object-cover"
                      />
                    </div>
                    <div className="text-[11px] font-mono leading-tight">
                      <span className="text-white block font-semibold">{squad.leader.name}</span>
                      <span className={squad.leader.handle === creatorUser.github_username || squad.leader.name.includes('(You)') ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                        {squad.leader.handle === creatorUser.github_username || squad.leader.name.includes('(You)') ? 'Lead (You)' : 'Leader'} • @{squad.leader.handle}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {squad.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-950 border border-white/5 text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedSquadId(squad.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white hover:text-cyan-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Open Squad Deck</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setApplySquadTarget(squad);
                        setIsApplyModalOpen(true);
                      }}
                      disabled={isFullSquad}
                      className="py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 text-xs font-mono text-cyan-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      {isFullSquad ? 'Full' : 'Join'}
                    </button>
                  </div>

                  {/* Direct 1-Click Open Squad Workspace */}
                  <button
                    onClick={() => handleLaunchSprintWithSquad(squad)}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-sans text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title={`Open ${squad.name} Workspace`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                    <span className="truncate">Open {squad.name} Workspace &rarr;</span>
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
        </>
        )}

        {/* Create Squad Modal */}
        <AnimatePresence>
          {isCreateSquadOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-space-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold font-sans text-white">Create Hackathon Squad</h2>
                    <p className="text-xs font-mono text-cyan-400">Initialize a new team for your sprint</p>
                  </div>
                  <button
                    onClick={() => setIsCreateSquadOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Squad Lead (Creator) Card */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/80 border border-white/10">
                  <div className="relative">
                    <img
                      src={creatorUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${creatorUser.github_username}`}
                      alt={creatorUser.full_name}
                      className="w-9 h-9 rounded-xl border border-white/15 object-cover"
                    />
                  </div>
                  <div className="text-xs font-mono">
                    <div className="text-white font-bold flex items-center gap-2">
                      <span>{creatorUser.full_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                        Lead (You)
                      </span>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleCreateSquad}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateSquad(e);
                    }
                  }}
                  className="space-y-4 font-mono text-xs"
                >
                  {/* Squad Name with Quick Generator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        Squad Name
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const names = [
                            'Distributed CRDT Whiteboard',
                            'Autonomous Flash Arbiter',
                            'BioVector Diagnostic Mesh',
                            'Zero-Knowledge Identity Vault',
                            'Event-Driven Settlement Engine',
                            'eBPF Kernel Telemetry Agent',
                          ];
                          const picked = names[Math.floor(Math.random() * names.length)];
                          setNewSquadName(picked);
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Randomize Idea</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed CRDT Whiteboard"
                      value={newSquadName}
                      onChange={(e) => setNewSquadName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 text-xs font-sans transition-colors"
                    />
                  </div>

                  {/* Track / Domain & Target Capacity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-zinc-300 font-semibold block">Track</label>
                      <select
                        value={newSquadTrack}
                        onChange={(e) => setNewSquadTrack(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white focus:outline-none focus:border-cyan-400 text-xs cursor-pointer"
                      >
                        <option value="AI & Machine Learning">AI & Machine Learning</option>
                        <option value="Web3 & Algorithmic Finance">Web3 & DeFi</option>
                        <option value="Full-Stack & Realtime Systems">Full-Stack & Realtime</option>
                        <option value="Developer Tooling">Developer Tooling</option>
                        <option value="HealthTech & Bio">HealthTech & Bio</option>
                        <option value="Open Innovation">Open Innovation</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-300 font-semibold block">Team Capacity</label>
                      <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950 rounded-xl border border-white/10">
                        {[2, 3, 4, 5].map((cap) => (
                          <button
                            key={cap}
                            type="button"
                            onClick={() => setNewSquadCapacity(cap)}
                            className={`py-1.5 rounded-lg text-center font-mono text-xs transition-all cursor-pointer ${
                              newSquadCapacity === cap
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {cap}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Tech Stack Tag System */}
                  <div className="space-y-2">
                    <label className="text-zinc-300 font-semibold flex items-center justify-between">
                      <span>PRIMARY_TECH_STACK</span>
                      <span className="text-[10px] text-zinc-500 font-normal">
                        {squadTagList.length} tags selected
                      </span>
                    </label>

                    {/* Active Selected Tags */}
                    {squadTagList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-950/70 border border-white/5">
                        {squadTagList.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => setSquadTagList(squadTagList.filter((t) => t !== tag))}
                              className="hover:text-white transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tag Input Field */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add technology (e.g. Next.js, PyTorch)... Press Enter"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const val = customTagInput.trim().replace(',', '');
                            if (val && !squadTagList.includes(val)) {
                              setSquadTagList([...squadTagList, val]);
                              setCustomTagInput('');
                            }
                          }
                        }}
                        className="flex-1 p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = customTagInput.trim().replace(',', '');
                          if (val && !squadTagList.includes(val)) {
                            setSquadTagList([...squadTagList, val]);
                            setCustomTagInput('');
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>

                    {/* 1-Click Popular Tag Ingestion Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-zinc-500">Popular:</span>
                      {[
                        'FastAPI',
                        'React',
                        'Docker',
                        'PostgreSQL',
                        'PyTorch',
                        'WebSockets',
                        'Tailwind',
                        'Redis',
                        'Solidity',
                      ].map((sug) => {
                        const isAdded = squadTagList.includes(sug);
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => {
                              if (isAdded) {
                                setSquadTagList(squadTagList.filter((t) => t !== sug));
                              } else {
                                setSquadTagList([...squadTagList, sug]);
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer border ${
                              isAdded
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-zinc-950 text-zinc-400 border-white/5 hover:border-white/15 hover:text-white'
                            }`}
                          >
                            {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sprint Mission / Pitch */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-300 font-semibold block">SPRINT_MISSION_PITCH</label>
                      <button
                        type="button"
                        onClick={() => {
                          setNewSquadMission(
                            'Building an autonomous, resilient micro-service stack with real-time state synchronization, zero merge conflicts, and automated CI pipelines.'
                          );
                        }}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Insert Pitch Template</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="What is your squad building in this 24-hour hackathon sprint?"
                      value={newSquadMission}
                      onChange={(e) => setNewSquadMission(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 text-xs font-sans transition-colors resize-none"
                    />
                  </div>

                  {/* Footer Actions with Keyboard Hint */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <span>Press</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 font-mono text-[9px]">
                        Ctrl+Enter
                      </kbd>
                      <span>to submit</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateSquadOpen(false)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                      >
                        <span>Create Squad & Open Deck</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Join Request Modal */}
        <AnimatePresence>
          {isApplyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-space-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold font-sans text-white">Apply to Join Squad</h2>
                    <p className="text-xs font-mono text-cyan-400">
                      Target: {applySquadTarget?.name || activeSquad?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsApplyModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmitJoinRequest}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmitJoinRequest(e);
                    }
                  }}
                  className="space-y-4 font-mono text-xs"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/80 border border-white/5">
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${applyHandle || 'builder'}`}
                      alt="Avatar Preview"
                      className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white font-sans truncate">
                        {applyName || 'Anonymous Builder'}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 truncate">
                        @{applyHandle || 'github-handle'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-300 font-semibold block">YOUR_NAME</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jordan Miller"
                        value={applyName}
                        onChange={(e) => setApplyName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 text-xs font-sans transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-300 font-semibold block">GITHUB_HANDLE</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. jmiller-code"
                        value={applyHandle}
                        onChange={(e) => setApplyHandle(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 text-xs transition-colors"
                      />
                    </div>
                  </div>

                  {/* Primary Specialization Pills */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold block">PRIMARY_SPECIALIZATION</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: 'DevOps', label: 'DevOps' },
                        { id: 'AI', label: 'AI & Data' },
                        { id: 'Frontend', label: 'Frontend' },
                        { id: 'Backend', label: 'Backend' },
                        { id: 'Database', label: 'Database' },
                      ].map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setApplyRole(role.id)}
                          className={`py-2 px-1 rounded-xl text-center font-mono text-[11px] transition-all cursor-pointer border ${
                            applyRole === role.id
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-sm'
                              : 'bg-zinc-950 text-zinc-400 border-white/5 hover:border-white/15 hover:text-white'
                          }`}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pitch Note */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-300 font-semibold block">PITCH_NOTE_TO_LEAD</label>
                      <button
                        type="button"
                        onClick={() => {
                          setApplyNote(
                            `Experienced ${applyRole} engineer. Ready to build features, write tests, and ship resilient code with zero downtime.`
                          );
                        }}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        Insert Note
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Why do you want to join this squad and what will you build?"
                      value={applyNote}
                      onChange={(e) => setApplyNote(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 text-xs font-sans transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <span>Press</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 font-mono text-[9px]">
                        Ctrl+Enter
                      </kbd>
                      <span>to submit</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsApplyModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
                      >
                        Submit Join Request
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: SPECIFIC SQUAD DECK (Shown when a team is selected)
  // ONLY HERE DOES THE 5-DOMAIN COMPETENCY RADAR (IMPACT GRAPH) APPEAR!
  // =========================================================================
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Navigation Bar with Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <button
            onClick={() => setSelectedSquadId(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-space-950 border border-white/10 hover:border-cyan-400/40 text-xs font-mono text-slate-400 hover:text-white transition-all cursor-pointer mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Squads</span>
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
              {teamName}
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {activeSquad?.track}
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-space-950 text-slate-400 border border-white/10">
              {currentTeam.length} / {maxTeamSize} {maxTeamSize === 1 ? 'Member' : 'Members'}
            </span>
            {globalActiveSquad?.id === activeSquad?.id && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                ACTIVE SPRINT SQUAD
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 font-sans max-w-2xl">
            {activeSquad?.mission}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleCopyRoster}
            className="px-3.5 py-2 rounded-xl bg-space-950 border border-white/10 hover:border-cyan-400/40 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            {copiedRoster ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRoster ? 'Copied Roster' : 'Copy Roster for Devpost'}</span>
          </button>

          <button
            onClick={() => {
              if (activeSquad) {
                handleLaunchSprintWithSquad(activeSquad, teamIds);
              }
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-zinc-950 font-sans text-xs font-extrabold flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all cursor-pointer"
            title={`Open ${activeSquad?.name || 'Squad'} Workspace`}
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
            <span>Open {activeSquad?.name || 'Squad'} Workspace &rarr;</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Squad Settings"
            className="p-2 rounded-xl bg-space-950 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {inviteSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
          <span>{inviteSuccess}</span>
          <button onClick={() => setInviteSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* 5-DOMAIN COMPETENCY RADAR (IMPACT GRAPH) & SYNERGY OVERVIEW */}
      <GlassCard className="p-6 sm:p-8 border border-white/10 bg-space-950/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* SVG Spider Graph */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-3">
            <div className="relative w-[240px] h-[240px]">
              <svg viewBox="0 0 220 220" className="w-full h-full overflow-visible">
                {/* Background Concentric Rings */}
                {[0.25, 0.5, 0.75, 1.0].map((ring, idx) => {
                  const pts = DOMAINS.map((_, dIdx) => {
                    const { x, y } = getCoordinates(dIdx, ring);
                    return `${x},${y}`;
                  }).join(' ');
                  return (
                    <polygon
                      key={idx}
                      points={pts}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Spoke Axis Lines */}
                {DOMAINS.map((_, dIdx) => {
                  const { x, y } = getCoordinates(dIdx, 1.0);
                  return (
                    <line
                      key={dIdx}
                      x1={CENTER_X}
                      y1={CENTER_Y}
                      x2={x}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Projected Radar (Simulated on candidate hover) */}
                {projectedRadarPoints && (
                  <polygon
                    points={projectedRadarPoints}
                    fill="rgba(0, 255, 136, 0.15)"
                    stroke="#00FF88"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Current Squad Radar Polygon */}
                <polygon
                  points={currentRadarPoints}
                  fill="rgba(0, 240, 255, 0.2)"
                  stroke="#00F0FF"
                  strokeWidth="2"
                />

                {/* Domain Axis Labels */}
                {DOMAINS.map((domain, dIdx) => {
                  const { x, y } = getLabelCoordinates(dIdx);
                  const val = Math.round((coverage[domain] || 0) * 100);
                  return (
                    <text
                      key={domain}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[9px] font-mono fill-slate-400 font-bold"
                    >
                      {domain} ({val}%)
                    </text>
                  );
                })}
              </svg>
            </div>

            <div className="text-center font-mono text-[11px] text-slate-400">
              Hover over candidates below to preview impact
            </div>
          </div>

          {/* Stack Coverage Details & Synergy */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
                  STACK COVERAGE ANALYSIS
                </span>
                <h3 className="text-2xl font-extrabold font-sans text-white">
                  {overallSynergy >= 85 ? 'Balanced Core Stack' : 'Gap Detected: Requires Specialist'}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold font-mono text-cyan-400">{overallSynergy}%</span>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Stack Coverage</span>
              </div>
            </div>

            {/* 5 Domain Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              {DOMAINS.map((d) => {
                const pct = Math.round((coverage[d] || 0) * 100);
                return (
                  <div key={d} className="p-3 rounded-xl bg-space-950 border border-white/5 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{d}</span>
                      <span className={pct >= 80 ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 80 ? 'bg-cyan-400' : 'bg-amber-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Invite Teammate by GitHub Handle Form */}
            <form onSubmit={handleScanAndDraftCustom} className="pt-2 flex flex-wrap sm:flex-nowrap gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">@</span>
                <input
                  type="text"
                  placeholder="github-username"
                  value={customHandle}
                  onChange={(e) => setCustomHandle(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-space-950 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!customHandle.trim()) return;
                  const clean = customHandle.trim().replace('@', '');
                  handleOpenInviteUserModal({
                    full_name: clean.charAt(0).toUpperCase() + clean.slice(1),
                    github_username: clean,
                    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${clean}`,
                    skills: ['Full-Stack Integration', 'Git Flow'],
                    added_synergy: 16,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-mono text-cyan-300 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invite Teammate</span>
              </button>
              <button
                type="submit"
                disabled={isScanningCustom}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                {isScanningCustom ? 'Scanning...' : 'Draft'}
              </button>
            </form>
            {scanError && <p className="text-[11px] font-mono text-red-400">{scanError}</p>}
          </div>

        </div>
      </GlassCard>

      {/* SQUAD MEMBERS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
            <span>Squad Roster</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
              {currentTeam.length} {currentTeam.length === 1 ? 'Member' : 'Members'}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentTeam.map((member: any, idx: number) => {
            const isSquadLead = idx === 0 || member.id === creatorUser.id || member.github_username === activeSquad?.leader?.handle;
            const isYou = member.id === creatorUser.id || member.github_username === creatorUser.github_username;
            const roleBadge = isSquadLead
              ? { name: isYou ? 'Lead (You)' : 'Squad Lead', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 font-semibold' }
              : getRoleBadge(idx);
            return (
              <GlassCard
                key={member.id}
                className="p-5 border border-white/10 flex flex-col justify-between space-y-4 relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-10 h-10 rounded-xl border border-white/10 object-cover"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{member.full_name}</span>
                        {isYou && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400 truncate">@{member.github_username}</div>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border block truncate ${roleBadge.color}`}>
                    {roleBadge.name}
                  </span>

                  <div className="space-y-1 text-[11px] font-mono text-slate-400">
                    <div className="truncate">Branch: {member.active_branch || 'main'}</div>
                    <div className="truncate">Timezone: {member.timezone || 'UTC-4'}</div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {member.skills?.slice(0, 3).map((s: any, sIdx: number) => (
                      <span key={sIdx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                        {typeof s === 'string' ? s : s.skill_name}
                      </span>
                    ))}
                  </div>
                </div>

                {isSquadLead ? (
                  <div className="w-full py-1.5 text-center text-[10px] font-mono text-amber-400/80 bg-amber-500/5 rounded-lg border border-amber-500/15 font-semibold">
                    Lead {isYou ? '(You)' : ''}
                  </div>
                ) : (
                  <button
                    onClick={() => handleRemoveTeammate(member.id)}
                    className="w-full py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[10px] font-mono transition-colors cursor-pointer"
                  >
                    Remove from Squad
                  </button>
                )}
              </GlassCard>
            );
          })}

          {/* Vacant Member Slots */}
          {Array.from({ length: Math.max(0, maxTeamSize - currentTeam.length) }).map((_, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-dashed border-white/10 bg-space-950/40 flex flex-col items-center justify-center text-center space-y-2 min-h-[190px]"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-500">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="text-xs font-mono text-slate-400 font-bold">Vacant Slot {currentTeam.length + idx + 1}</div>
              <p className="text-[10px] font-mono text-slate-500 max-w-[140px]">
                Accept a join request below or draft by GitHub handle
              </p>
              <button
                type="button"
                onClick={() => {
                  handleOpenInviteUserModal({
                    full_name: 'Developer Candidate',
                    github_username: 'builder-dev',
                    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=slot-${idx}`,
                    skills: ['TypeScript', 'FastAPI', 'Docker'],
                    added_synergy: 16,
                  });
                }}
                className="mt-1 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-[10px] font-mono text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Invite Developer</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* INBOUND JOIN REQUESTS (Leader Review Queue) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">
              Inbound Join Requests ({joinRequests.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Leader Review • Hover to preview impact
          </span>
        </div>

        {joinRequests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-space-950 border border-white/5 text-center font-mono text-xs text-slate-500">
            No pending join requests for this squad right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinRequests.map((req) => (
              <GlassCard
                key={req.id}
                onMouseEnter={() => setHoveredCandidate(req)}
                onMouseLeave={() => setHoveredCandidate(null)}
                className={`p-5 border flex flex-col justify-between space-y-4 transition-all ${
                  hoveredCandidate?.id === req.id
                    ? 'border-emerald-500/70 bg-space-950/90'
                    : 'border-white/10'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={req.applicant.avatar_url}
                        alt={req.applicant.full_name}
                        className="w-10 h-10 rounded-xl border border-white/10 object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{req.applicant.full_name}</div>
                        <div className="text-[10px] font-mono text-cyan-400">@{req.applicant.github_username}</div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                      +{req.added_synergy}% Skill Fit
                    </span>
                  </div>

                  <p className="text-xs font-sans text-slate-300 italic bg-space-950 p-2.5 rounded-xl border border-white/5">
                    "{req.note}"
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono p-2 rounded-xl bg-space-950 border border-white/5">
                    <div>
                      <span className="text-slate-500 block">Activity</span>
                      <span className="text-cyan-300 font-bold truncate block">{req.stats.commit_velocity}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Language</span>
                      <span className="text-purple-300 font-bold truncate block">{req.stats.top_language}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Focus</span>
                      <span className="text-emerald-300 font-bold truncate block">{req.stats.experience_level}</span>
                    </div>
                  </div>

                  {/* Impact Text explicitly updated to "Impact:" as requested */}
                  <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">Impact:</span>{' '}
                    <span>{req.impact_summary}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleDeclineRequest(req.id)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="px-4 py-1.5 rounded-lg bg-white text-space-950 font-bold text-xs font-mono hover:bg-slate-200 transition-colors shadow-sm"
                  >
                    Accept into Squad
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* OUTBOUND SQUAD REQUESTS (Requests Given to Developers) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">
              Pending Outbound Invitations ({outboundInvitations.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Pending invitations sent by squad
          </span>
        </div>

        {outboundInvitations.length === 0 ? (
          <div className="p-6 rounded-2xl bg-space-950 border border-white/5 text-center font-mono text-xs text-slate-500">
            No outbound invitations currently pending. Select a developer below to send an invitation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outboundInvitations.map((inv) => (
              <GlassCard
                key={inv.id}
                className="p-4 border border-white/10 flex flex-col justify-between space-y-3 bg-space-950/60"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={inv.target_avatar_url}
                        alt={inv.target_user_name}
                        className="w-9 h-9 rounded-xl border border-white/10 object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{inv.target_user_name}</div>
                        <div className="text-[10px] font-mono text-cyan-400">@{inv.target_username}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        inv.status === 'ACCEPTED'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : inv.status === 'DECLINED'
                          ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Offered Role:</span>
                    <span className="text-purple-300 font-bold">{inv.role}</span>
                  </div>

                  <p className="text-xs font-sans text-slate-300 italic bg-space-900/80 p-2.5 rounded-xl border border-white/5">
                    "{inv.pitch_note}"
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock3 className="w-3 h-3 text-slate-500" />
                    <span>Sent: {inv.created_at}</span>
                  </span>
                  {inv.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelOutboundInvitation(inv.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Cancel Invitation</span>
                    </button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* RECOMMENDED SPECIALISTS TO DRAFT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white font-sans">
              Recommended Specialists
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            {['all', 'devops', 'ai', 'frontend'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredRecommendations.slice(0, 3).map((rec: any) => (
            <GlassCard
              key={rec.user.id}
              onMouseEnter={() => setHoveredCandidate(rec)}
              onMouseLeave={() => setHoveredCandidate(null)}
              className="p-5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-cyan-400/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={rec.user.avatar_url}
                      alt={rec.user.full_name}
                      className="w-9 h-9 rounded-xl border border-white/10 object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{rec.user.full_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">@{rec.user.github_username}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                    +{rec.added_synergy}% Fit
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-300">
                  <span className="text-cyan-400 font-bold">Impact:</span> {rec.impact_summary || 'Fills domain requirements'}
                </div>

                <div className="flex flex-wrap gap-1">
                  {rec.user.skills?.slice(0, 3).map((s: any, idx: number) => (
                    <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                      {typeof s === 'string' ? s : s.skill_name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleOpenInviteUserModal({
                      id: rec.user.id,
                      full_name: rec.user.full_name,
                      github_username: rec.user.github_username,
                      avatar_url: rec.user.avatar_url,
                      skills: rec.user.skills,
                      added_synergy: rec.added_synergy,
                    })
                  }
                  disabled={isFull}
                  className="flex-1 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-xs font-mono font-semibold text-cyan-300 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invite Teammate</span>
                </button>
                <button
                  onClick={() => handleAddTeammate(rec.user.id, rec.user.full_name)}
                  disabled={isFull}
                  title="Directly draft into squad"
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                >
                  Draft
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Squad Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-space-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white font-sans">Squad Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleUpdateTeamSettings(teamName, maxTeamSize);
                  }
                }}
                className="space-y-4 font-mono text-xs"
              >
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-semibold block">Squad Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-semibold block">Team Capacity</label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950 rounded-xl border border-white/10">
                    {[2, 3, 4, 5].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setMaxTeamSize(cap)}
                        className={`py-2 rounded-lg text-center font-mono text-xs transition-all cursor-pointer ${
                          maxTeamSize === cap
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {cap} Members
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <span>Press</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 font-mono text-[9px]">
                    Ctrl+Enter
                  </kbd>
                  <span>to save</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateTeamSettings(teamName, maxTeamSize)}
                    className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs font-mono hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Squad Invitation to Developer Modal */}
      <AnimatePresence>
        {isInviteUserModalOpen && inviteTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-space-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold font-sans text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-cyan-400" />
                    <span>Invite Developer to Squad</span>
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    Target Squad: <span className="text-cyan-400 font-bold">{teamName}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsInviteUserModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSendSquadInvitation}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSendSquadInvitation(e);
                  }
                }}
                className="space-y-5 font-mono text-xs"
              >
                {/* Developer Preview */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border border-white/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={inviteTargetUser.avatar_url}
                      alt={inviteTargetUser.full_name}
                      className="w-10 h-10 rounded-xl border border-white/10 object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{inviteTargetUser.full_name}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">@{inviteTargetUser.github_username}</div>
                      {inviteTargetUser.skills && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[240px] mt-0.5">
                          {inviteTargetUser.skills.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold shrink-0">
                    +{inviteTargetUser.added_synergy || 18}% Fit
                  </span>
                </div>

                {/* Role Offered Selector */}
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-semibold block">Offered Role</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      'Core Architect (Lead)',
                      'Frontend Engineer',
                      'AI & Data Specialist',
                      'DevOps & Infrastructure Lead',
                      'Backend Architect',
                      'Full-Stack Engineer',
                    ].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`p-2 rounded-xl text-left font-mono text-[10px] transition-all cursor-pointer border ${
                          inviteRole === role
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-sm'
                            : 'bg-zinc-950 text-zinc-400 border-white/5 hover:border-white/15 hover:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pitch Note */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-300 font-semibold block">Invitation Message</label>
                    <button
                      type="button"
                      onClick={() => {
                        setInvitePitchNote(
                          `Hey ${inviteTargetUser.full_name.split(' ')[0]}! We have strong architectural foundations in ${teamName} and would love to invite you to join as our ${inviteRole} for the sprint!`
                        );
                      }}
                      className="text-[10px] text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      Insert Pitch Template
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="Write a personal note inviting this developer to your squad..."
                    value={invitePitchNote}
                    onChange={(e) => setInvitePitchNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 text-xs font-sans transition-colors resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <span>Press</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 font-mono text-[9px]">
                      Ctrl+Enter
                    </kbd>
                    <span>to send</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInviteUserModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingInvite}
                      className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-bold transition-all shadow-sm cursor-pointer text-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingInvite ? 'Sending...' : 'Send Invitation'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
