import jwt from 'jsonwebtoken';

export type OAuthProvider = 'google' | 'github' | 'microsoft';

export interface VerifiedOAuthUser {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface OAuthOnboardingTokenPayload {
  email: string;
  name: string;
  avatarUrl?: string | null;
  provider: OAuthProvider;
  providerId: string;
  type: 'oauth_onboarding';
}

const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge_super_secret_jwt_access_key_2026';

export function isOauthConfigured(provider: OAuthProvider): boolean {
  switch (provider) {
    case 'google':
      return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case 'github':
      return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    case 'microsoft':
      return Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
    default:
      return false;
  }
}

export function getAuthorizationUrl(
  provider: OAuthProvider,
  redirectUri: string,
  state: string = ''
): { authUrl: string; configured: boolean } {
  if (!isOauthConfigured(provider)) {
    throw new Error(
      `OAuth provider '${provider}' is not configured on the server. Please set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in the Render Environment Variables.`
    );
  }

  switch (provider) {
    case 'google': {
      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
        state: JSON.stringify({ provider: 'google', customState: state }),
      });
      return {
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        configured: true,
      };
    }

    case 'github': {
      const clientId = process.env.GITHUB_CLIENT_ID!;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'read:user user:email',
        state: JSON.stringify({ provider: 'github', customState: state }),
      });
      return {
        authUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
        configured: true,
      };
    }

    case 'microsoft': {
      const clientId = process.env.MICROSOFT_CLIENT_ID!;
      const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email User.Read',
        response_mode: 'query',
        state: JSON.stringify({ provider: 'microsoft', customState: state }),
      });
      return {
        authUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`,
        configured: true,
      };
    }

    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

export async function exchangeCodeForVerifiedUser(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
): Promise<VerifiedOAuthUser> {
  if (!isOauthConfigured(provider)) {
    throw new Error(
      `OAuth provider '${provider}' is not configured on the server. Please set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in environment variables.`
    );
  }

  switch (provider) {
    case 'google': {
      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData: any = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Google OAuth code');
      }

      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const userData: any = await userRes.json();
      if (!userRes.ok || !userData.email) {
        throw new Error('Failed to retrieve verified email from Google');
      }

      if (userData.email_verified === false) {
        throw new Error('Google email is not verified');
      }

      return {
        provider: 'google',
        providerId: userData.sub,
        email: userData.email.toLowerCase().trim(),
        name: userData.name || userData.email.split('@')[0],
        avatarUrl: userData.picture || null,
      };
    }

    case 'github': {
      const clientId = process.env.GITHUB_CLIENT_ID!;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET!;

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData: any = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange GitHub OAuth code');
      }

      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'SkillBridge-App',
        },
      });

      const userData: any = await userRes.json();
      if (!userRes.ok) {
        throw new Error('Failed to retrieve GitHub profile');
      }

      let email = userData.email;
      if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'SkillBridge-App',
          },
        });
        const emailsData: any = await emailsRes.json();
        if (Array.isArray(emailsData)) {
          const primaryVerified = emailsData.find((e: any) => e.primary && e.verified) || emailsData.find((e: any) => e.verified);
          if (primaryVerified) email = primaryVerified.email;
        }
      }

      if (!email) {
        throw new Error('No verified email found on GitHub account');
      }

      return {
        provider: 'github',
        providerId: String(userData.id),
        email: email.toLowerCase().trim(),
        name: userData.name || userData.login || email.split('@')[0],
        avatarUrl: userData.avatar_url || null,
      };
    }

    case 'microsoft': {
      const clientId = process.env.MICROSOFT_CLIENT_ID!;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
      const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

      const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData: any = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Microsoft OAuth code');
      }

      const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const graphData: any = await graphRes.json();
      if (!graphRes.ok) {
        throw new Error('Failed to retrieve Microsoft user profile');
      }

      const email = (graphData.mail || graphData.userPrincipalName || '').toLowerCase().trim();
      if (!email) {
        throw new Error('No valid email found on Microsoft account');
      }

      return {
        provider: 'microsoft',
        providerId: graphData.id,
        email,
        name: graphData.displayName || email.split('@')[0],
        avatarUrl: null,
      };
    }

    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

/**
 * Creates a signed onboarding token for newly authenticated OAuth users who need to choose a role
 */
export function createOAuthOnboardingToken(verifiedUser: VerifiedOAuthUser): string {
  const payload: OAuthOnboardingTokenPayload = {
    email: verifiedUser.email,
    name: verifiedUser.name,
    avatarUrl: verifiedUser.avatarUrl,
    provider: verifiedUser.provider,
    providerId: verifiedUser.providerId,
    type: 'oauth_onboarding',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Verifies and decodes the OAuth onboarding token
 */
export function verifyOAuthOnboardingToken(token: string): OAuthOnboardingTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as OAuthOnboardingTokenPayload;
    if (decoded.type !== 'oauth_onboarding') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (err: any) {
    throw new Error('OAuth onboarding session expired or invalid. Please sign in again.');
  }
}
