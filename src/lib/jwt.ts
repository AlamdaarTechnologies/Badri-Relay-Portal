import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export async function signToken(
  payload: JWTPayload,
  secret: string,
  expiresIn: string | number
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expiresIn)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(new TextEncoder().encode(secret))
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload> {
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(secret)
  )
  return payload
}
