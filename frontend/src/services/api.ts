import { getActiveBYOKHeaders } from './cryptoVault';

const API_BASE = '/api/v1';

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function loginUser(identifier: string, password?: string) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Authentication failed');
  }
  return res.json();
}

export async function signupUser(data: {
  full_name: string;
  github_username: string;
  email?: string;
  password?: string;
  avatar_url?: string;
  role?: string;
}) {
  const res = await fetch(`${API_BASE}/users/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create profile');
  }
  return res.json();
}

export async function scanSkills(githubOrResume: string, fullName?: string, avatarUrl?: string) {
  const res = await fetch(`${API_BASE}/users/scan-skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      github_or_resume: githubOrResume,
      full_name: fullName,
      avatar_url: avatarUrl,
    }),
  });
  if (!res.ok) throw new Error('Failed to scan profile');
  return res.json();
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<{ status: string; id: string; avatar_url: string }> {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}/avatar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar_url: avatarUrl }),
  });
  if (!res.ok) throw new Error('Failed to update avatar');
  return res.json();
}

export async function decomposeProject(
  title: string,
  description: string,
  squadContext?: { squadId?: string; squadName?: string; teamUserIds?: string[] }
) {
  const byokHeaders = await getActiveBYOKHeaders();
  const res = await fetch(`${API_BASE}/projects/decompose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...byokHeaders,
    },
    body: JSON.stringify({
      title,
      description,
      team_user_ids: squadContext?.teamUserIds,
      squad_id: squadContext?.squadId,
      squad_name: squadContext?.squadName,
    }),
  });
  if (!res.ok) throw new Error('Failed to decompose idea');
  return res.json();
}

export async function validateBYOKKey(provider: string, apiKey: string, model?: string) {
  const res = await fetch(`${API_BASE}/byok/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, api_key: apiKey, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to validate key' }));
    throw new Error(err.detail || 'Validation failed');
  }
  return res.json();
}

export async function fetchBYOKProviders() {
  const res = await fetch(`${API_BASE}/byok/providers`);
  if (!res.ok) throw new Error('Failed to fetch providers');
  return res.json();
}

export async function fetchProject(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch project roadmap');
  return res.json();
}

export async function updateTask(taskId: string, updates: any) {
  const res = await fetch(`${API_BASE}/projects/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function splitTask(
  taskId: string,
  strategy: 'frontend_backend' | 'logic_testing' | 'parallel_micro' | 'custom' = 'frontend_backend',
  customSubtasks?: Array<{
    title: string;
    description: string;
    required_skills: string;
    api_route_spec?: any;
  }>
) {
  const res = await fetch(`${API_BASE}/projects/tasks/${taskId}/split`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      strategy,
      custom_subtasks: customSubtasks,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to split task' }));
    throw new Error(err.detail || 'Failed to split task');
  }
  return res.json();
}

export async function createTask(
  projectId: string,
  taskData: {
    epic_id: string;
    title: string;
    description: string;
    required_skills: string;
    depends_on?: string[];
    api_route_spec?: any;
  }
) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create task' }));
    throw new Error(err.detail || 'Failed to create task');
  }
  return res.json();
}

export async function deleteTask(taskId: string) {
  const res = await fetch(`${API_BASE}/projects/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete task' }));
    throw new Error(err.detail || 'Failed to delete task');
  }
  return res.json();
}

export async function previewScaffold(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/scaffold/${projectId}/preview`);
  if (!res.ok) throw new Error('Failed to fetch scaffold preview');
  return res.json();
}

export function getDownloadScaffoldUrl(projectId: string) {
  return `${API_BASE}/projects/scaffold/${projectId}/download`;
}

export async function simulateWebhook(payload: {
  event_type: string;
  task_code: string;
  commit_message?: string;
  branch_name?: string;
  ci_conclusion?: string;
}) {
  const res = await fetch(`${API_BASE}/webhooks/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to simulate webhook');
  return res.json();
}

export async function fetchTeamMatch(teamIds?: string) {
  const url = teamIds ? `${API_BASE}/users/team/match?team_ids=${encodeURIComponent(teamIds)}` : `${API_BASE}/users/team/match`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch team match');
  return res.json();
}

export async function fetchUserProfile(userId: string) {
  const res = await fetch(`${API_BASE}/users/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function updateProjectRepo(projectId: string, githubRepo: string): Promise<{ status: string; github_repo: string }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/repo`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ github_repo: githubRepo }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update project repository' }));
    throw new Error(err.detail || 'Failed to update project repository');
  }
  return res.json();
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  squad_name: string;
  target_username: string;
  target_user_id?: string;
  target_user_name: string;
  target_avatar_url: string;
  role: string;
  pitch_note: string;
  projected_synergy: number;
  invited_by_name: string;
  invited_by_handle: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  created_at: string;
}

export async function sendTeamInvitation(payload: {
  team_id: string;
  squad_name: string;
  target_username: string;
  target_user_id?: string;
  target_user_name?: string;
  target_avatar_url?: string;
  role: string;
  pitch_note?: string;
  projected_synergy?: number;
  invited_by_name?: string;
  invited_by_handle?: string;
}): Promise<{ status: string; message: string; invitation: TeamInvitation }> {
  const res = await fetch(`${API_BASE}/users/team/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send invitation' }));
    throw new Error(err.detail || 'Failed to send invitation');
  }
  return res.json();
}

export async function fetchTeamInvitations(params?: {
  target_username?: string;
  team_id?: string;
  status?: string;
}): Promise<{ count: number; invitations: TeamInvitation[] }> {
  const query = new URLSearchParams();
  if (params?.target_username) query.set('target_username', params.target_username);
  if (params?.team_id) query.set('team_id', params.team_id);
  if (params?.status) query.set('status', params.status);

  const url = `${API_BASE}/users/team/invitations${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch team invitations');
  return res.json();
}

export async function respondTeamInvitation(
  inviteId: string,
  action: 'accept' | 'decline' | 'cancel'
): Promise<{ status: string; action: string; invitation: TeamInvitation }> {
  const res = await fetch(`${API_BASE}/users/team/invitations/${inviteId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to respond to invitation' }));
    throw new Error(err.detail || 'Failed to respond to invitation');
  }
  return res.json();
}

export async function cancelTeamInvitation(inviteId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/users/team/invitations/${inviteId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to cancel invitation' }));
    throw new Error(err.detail || 'Failed to cancel invitation');
  }
  return res.json();
}



