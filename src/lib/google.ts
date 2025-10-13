export async function fetchGoogleProfilePicture(options: {
  accessToken?: string
  idToken?: string
  fallbackUrl?: string
}): Promise<string | null> {
  const { accessToken, idToken, fallbackUrl } = options

  // 1) Try Google People API via access token (userinfo endpoint is lighter and sufficient)
  if (accessToken) {
    try {
      const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      })
      if (resp.ok) {
        const u = await resp.json()
        if (u?.picture && typeof u.picture === 'string') return u.picture as string
      }
    } catch {}
  }

  // 2) Try decoding id_token (JWT) and read picture claim (no network needed)
  if (idToken) {
    try {
      const payloadB64 = idToken.split(".")[1]
      const json = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"))
      if (json?.picture && typeof json.picture === 'string') return json.picture as string
    } catch {}
  }

  // 3) Fallback
  return fallbackUrl || null
}








