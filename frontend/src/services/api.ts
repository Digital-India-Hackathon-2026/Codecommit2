export const API_BASE_URL = "http://10.48.235.33:8000";
export const ADMIN_TOKEN = "admin-secret-123";

export interface Device {
  id: string;
  fw_ver: string;
  is_active: boolean;
  is_online: boolean;
  last_seen: string | null;
  created_at: string | null;
  cert_expiry: string | null;
  days_until_expiry: number | null;
  rotation_due_at: string | null;
  rotation_due_in_days: number | null;
  rotation_overdue: boolean;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
}

const authHeaders = {
  "X-Admin-Token": ADMIN_TOKEN,
  "Content-Type": "application/json",
};

export const fetchDevices = async (): Promise<Device[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      headers: authHeaders,
    });
    if (!response.ok) throw new Error("Failed to fetch devices");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch devices:", error);
    return [];
  }
};

export const revokeDevice = async (deviceId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/device/revoke/${deviceId}`, {
      method: "POST",
      headers: authHeaders,
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to revoke device:", error);
    return false;
  }
};

/**
 * Schedule a key rotation deadline for a device.
 * @param deviceId - The UUID of the device
 * @param rotateInDays - Number of days from now until rotation is required
 */
export const scheduleRotation = async (
  deviceId: string,
  rotateInDays: number
): Promise<{ status: string; rotation_due_at: string } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/device/schedule-rotation/${deviceId}`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ rotate_in_days: rotateInDays }),
    });
    if (!response.ok) throw new Error("Failed to schedule rotation");
    return await response.json();
  } catch (error) {
    console.error("Failed to schedule rotation:", error);
    return null;
  }
};

/**
 * Cancel a previously scheduled key rotation.
 */
export const cancelRotation = async (deviceId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/device/schedule-rotation/${deviceId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to cancel rotation:", error);
    return false;
  }
};

export const fetchProfile = async (): Promise<UserProfile | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: authHeaders,
    });
    if (!response.ok) throw new Error("Failed to fetch profile");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }
};

export const updateProfile = async (profile: UserProfile): Promise<UserProfile | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error("Failed to update profile");
    return await response.json();
  } catch (error) {
    console.error("Failed to update profile:", error);
    return null;
  }
};
