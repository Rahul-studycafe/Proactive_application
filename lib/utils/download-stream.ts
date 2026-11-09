/**
 * Streams/downloads monthly payroll CSV file from the backend API.
 */
export async function downloadAttendanceCsv(
  month: string | number,
  year: string | number,
): Promise<void> {
  const envUrl =
    (process.env.NEXT_PUBLIC_API_URL || "").trim() ||
    "http://localhost:5050/api/v1";
  const cleanUrl = envUrl.replace(/\/+$/, "");
  const baseUrl = cleanUrl.endsWith("/api/v1")
    ? cleanUrl
    : `${cleanUrl}/api/v1`;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const url = `${baseUrl}/attendance/export?month=${encodeURIComponent(
    String(month),
  )}&year=${encodeURIComponent(String(year))}`;

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorMsg = "Failed to download attendance CSV";
    try {
      const errorJson = await response.json();
      errorMsg = errorJson?.error?.message || errorJson?.message || errorMsg;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;

  // Extract filename from header or fallback
  const contentDisposition = response.headers.get("content-disposition");
  let filename = `attendance-export-${year}-${String(month).padStart(2, "0")}.csv`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
