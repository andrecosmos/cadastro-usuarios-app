import jwt from 'jsonwebtoken';
import { Buffer } from 'node:buffer';
import process from 'node:process';

const TOKEN_ISSUER = 'cadastro-usuarios';
const MINIMUM_SECRET_BYTES = 32;

function getTokenSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret) < MINIMUM_SECRET_BYTES) {
    throw new Error('JWT_SECRET não configurado ou muito curto.');
  }

  return secret;
}

export function createAccessToken(user) {
  const secret = getTokenSecret();

  if (!user?._id || !user.companyId || !user.role) {
    throw new Error('Usuário sem dados suficientes para autenticação.');
  }

  return jwt.sign(
    {
      companyId: String(user.companyId),
      role: user.role
    },
    secret,
    {
      subject: String(user._id),
      issuer: TOKEN_ISSUER,
      algorithm: 'HS256',
      expiresIn: '8h'
    }
  );
}

export function authenticate(req, res, next) {
  let secret;
  try {
    secret = getTokenSecret();
  } catch {
    return res.status(500).json({ error: 'Autenticação não configurada.' });
  }

  const authorization = req.get('authorization') || '';
  const tokenMatch = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!tokenMatch) {
    return res.status(401).json({ error: 'Autenticação obrigatória.' });
  }

  try {
    const claims = jwt.verify(tokenMatch[1], secret, {
      issuer: TOKEN_ISSUER,
      algorithms: ['HS256']
    });

    if (
      typeof claims.sub !== 'string' ||
      typeof claims.companyId !== 'string' ||
      typeof claims.role !== 'string'
    ) {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    req.auth = {
      userId: claims.sub,
      companyId: claims.companyId,
      role: claims.role
    };

    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin' || !req.auth.companyId) {
    return res.status(403).json({ error: 'Acesso administrativo negado.' });
  }

  return next();
}

export function requireCustomer(req, res, next) {
  if (req.auth?.role !== 'user') {
    return res.status(403).json({ error: 'Acesso de cliente negado.' });
  }

  return next();
}

export function requireCompanyScope(req, res, next) {
  const requestedCompanyId = req.body?.companyId ?? req.query?.companyId;

  if (requestedCompanyId && String(requestedCompanyId) !== req.auth.companyId) {
    return res.status(403).json({ error: 'Acesso a outra empresa negado.' });
  }

  return next();
}