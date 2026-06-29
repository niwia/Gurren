export interface GameInfo {
  appid: string;
  name: string;
  install_path: string;
  update_status: "up_to_date" | "update_available" | "unknown";
}

export type AppState = "idle" | "checking" | "downloading" | "error";

export interface CheckUpdatesResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export interface CheckUpdatesStatus {
  running: boolean;
  progress: number;
  status_msg: string;
  completed: boolean;
  error: boolean;
}

export interface UpdateGameResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export interface UpdateGameStatus {
  running: boolean;
  progress: number;
  status_msg: string;
  completed: boolean;
  error: boolean;
}

export interface LagannConfig {
  max_downloads: number;
  save_old_manifests: boolean;
  max_old_manifests: number;
  use_steamless: boolean;
  generate_achievements: boolean;
  auto_apply_goldberg: boolean;
}
