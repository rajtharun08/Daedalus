export interface UserSkill {
  id: string;
  skill_name: string;
  category: string;
  proficiency: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  github_username: string;
  github_id?: string;
  avatar_url: string;
  timezone: string;
  active_branch: string;
  skills: UserSkill[];
  assigned_task_count?: number;
}

export interface ApiRouteSpec {
  path: string;
  method: string;
  summary: string;
  response_mock?: any;
}

export interface Task {
  id: string;
  epic_id: string;
  task_code: string;
  title: string;
  description: string;
  required_skills: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
  ci_status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  branch_name?: string;
  pr_number?: number;
  last_commit_hash?: string;
  last_commit_message?: string;
  api_route_spec?: ApiRouteSpec;
  assignee?: User;
  depends_on: string[];
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  order_index: number;
  tasks: Task[];
}

export interface ProjectMetrics {
  critical_path_depth: number;
  max_parallel_tracks: number;
  estimated_sprint_hours: number;
  total_task_count: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  github_repo?: string;
  squad_id?: string;
  squad_name?: string;
  squad_member_ids?: string[];
  created_at: string;
  epics: Epic[];
  tasks: Task[];
  edges: { id: string; source: string; target: string }[];
  domain?: string;
  metrics?: ProjectMetrics;
}

export interface ActiveSquad {
  id: string;
  name: string;
  track?: string;
  mission?: string;
  memberIds: string[];
  members?: User[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'hub' | 'skill' | 'epic' | 'task';
  category?: string;
  proficiency?: number;
  status?: string;
  size?: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
}
