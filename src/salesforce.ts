import { Nango } from '@nangohq/node';
import dotenv from 'dotenv';

dotenv.config();

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY || '' });

const SALESFORCE_INTEGRATION_ID = 'asana';

// Function to get all leads using the Salesforce API
export async function getAllLeads(userId: string): Promise<any[]> {
  const leads: any[] = [];
  const page = 1;
  const connection = await nango.getConnection(SALESFORCE_INTEGRATION_ID, userId);
  const instanceUrl = connection.connection_config.instance_url;
  let nextUrl = '/services/data/v61.0/query';
  const query = 'SELECT Id, FirstName, LastName, Company, Status FROM Lead';
  try {
    while (nextUrl) {
      const response = await nango.proxy({
        method: 'GET',
        endpoint: nextUrl,
        providerConfigKey: SALESFORCE_INTEGRATION_ID,
        connectionId: userId,
        params: nextUrl.includes('query') ? { q: query } : {},
      });
      console.log();

      const data = response.data;
      leads.push(...data.records);

      nextUrl = data.nextRecordsUrl || '';
    }

    return leads;
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
}
