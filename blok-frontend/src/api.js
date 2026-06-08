const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function apiFetch(path, method, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }
  const options = { method: method, headers: headers };
  if (body) {
    options["body"] = JSON.stringify(body);
  }
  const response = await fetch(BASE_URL + path, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function registerUser(payload) {
  return apiFetch("/api/auth/register", "POST", payload, null);
}

export async function loginUser(email, password) {
  return apiFetch("/api/auth/login", "POST", { email: email, password: password }, null);
}

export async function getMe(token) {
  return apiFetch("/api/users/me", "GET", null, token);
}

export async function getTaskFeed(token, campus_id) {
  return apiFetch("/api/tasks/feed?campus_id=" + encodeURIComponent(campus_id), "GET", null, token);
}

export async function getTaskDetail(token, task_id) {
  return apiFetch("/api/tasks/" + task_id, "GET", null, token);
}

export async function postTask(token, payload) {
  return apiFetch("/api/tasks", "POST", payload, token);
}

export async function acceptTask(token, task_id) {
  return apiFetch("/api/tasks/" + task_id + "/accept", "POST", {}, token);
}

export async function startTask(token, task_id) {
  return apiFetch("/api/tasks/" + task_id + "/start", "POST", {}, token);
}

export async function completeTask(token, task_id, payload) {
  return apiFetch("/api/tasks/" + task_id + "/complete", "POST", payload, token);
}

export async function disputeTask(token, task_id) {
  return apiFetch("/api/tasks/" + task_id + "/dispute", "POST", {}, token);
}

export async function submitRating(token, task_id, payload) {
  return apiFetch("/api/tasks/" + task_id + "/rate", "POST", payload, token);
}

export async function getPriceAdvisory(token, params) {
  const query = "?category=" + encodeURIComponent(params.category)
    + "&base_block=" + encodeURIComponent(params.base_block)
    + "&target_block=" + encodeURIComponent(params.target_block)
    + "&campus_id=" + encodeURIComponent(params.campus_id);
  return apiFetch("/api/advisory/price" + query, "GET", null, token);
}

export async function getPiggybackTasks(token, task_id) {
  return apiFetch("/api/tasks/" + task_id + "/piggyback", "GET", null, token);
}

export async function getMessages(token, task_id) {
  return apiFetch("/api/messages/" + task_id, "GET", null, token);
}

export async function sendMessage(token, task_id, payload) {
  return apiFetch("/api/messages/" + task_id, "POST", payload, token);
}

export async function topupWallet(token, amount) {
  return apiFetch("/api/users/me/wallet/topup", "PATCH", { amount: amount }, token);
}
