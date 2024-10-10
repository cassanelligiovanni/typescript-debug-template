import { Nango } from '@nangohq/node';
import dotenv from 'dotenv';

dotenv.config();

const nango = new Nango({
  host: process.env.NANGO_SERVER_URL,
  secretKey: process.env.NANGO_SECRET_KEY || '',
});

const FACEBOOK_INTEGRATION_ID = 'facebook';

export async function getFacebookAdAccounts(userId: string): Promise<any[]> {
  try {
    const connection = await nango.getConnection(FACEBOOK_INTEGRATION_ID, userId);

    // First, fetch the user's Facebook ID
    const userResponse = await nango.proxy({
      method: 'GET',
      baseUrlOverride: 'https://graph.facebook.com',
      endpoint: '/v20.0/me',
      providerConfigKey: FACEBOOK_INTEGRATION_ID,
      connectionId: userId,
      params: {
        fields: 'id,name',
      },
    });

    const facebookUserId = userResponse.data.id;

    // Now use the Facebook user ID to fetch ad accounts
    const response = await nango.proxy({
      method: 'GET',
      baseUrlOverride: 'https://graph.facebook.com',
      endpoint: `/v20.0/${facebookUserId}/adaccounts`,
      providerConfigKey: FACEBOOK_INTEGRATION_ID,
      connectionId: userId,
      params: {
        fields: 'id,name,currency',
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error fetching Facebook ad accounts:', error);
    throw error;
  }
}
