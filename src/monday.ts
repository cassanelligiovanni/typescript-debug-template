import { Nango } from '@nangohq/node';
import dotenv from 'dotenv';

dotenv.config();

const nango = new Nango({
  host: process.env.NANGO_SERVER_URL,
  secretKey: process.env.NANGO_SECRET_KEY || '',
});

const MONDAY_INTEGRATION_ID = 'monday';

export async function getMondayTasks(userId: string): Promise<any[]> {
  try {
    // Step 1: Get the connection for the user
    // const connection = await nango.getConnection(MONDAY_INTEGRATION_ID, userId);

    // Step 2: Fetch boards (limiting to 1 for simplicity)
    const boardsResponse = await nango.proxy({
      method: 'POST',
      baseUrlOverride: 'https://api.monday.com/v2',
      endpoint: '/',
      providerConfigKey: MONDAY_INTEGRATION_ID,
      connectionId: userId,
      data: {
        query: `
          query {
              boards(limit: 1) {
              id
              name
            }
          }
        `,
      },
    });

    const boards = boardsResponse.data.data.boards;

    // Step 3: Check if there are any boards
    if (boards.length === 0) {
      return [];
    }

    const board = boards[0];

    // Step 4: Fetch items (tasks) for the first board
    const itemsResponse = await nango.proxy({
      method: 'POST',
      baseUrlOverride: 'https://api.monday.com/v2',
      endpoint: '/',
      providerConfigKey: MONDAY_INTEGRATION_ID,
      connectionId: userId,
      data: {
        query: `
          query {
            boards (ids: ${board.id}) {
            columns {
                id
                title
              }	
              items_page {
                cursor
                items {
                  id,
                  name,
                  column_values(ids: ["texto__1", "project_status"]) {
                    id
                    text
                    value
                    ... on StatusValue {
                      index
                      value
                      label
                      text
                    }
                  }
                }
              }
            }
        }
      `,
      },
    });

    // Step 5: Return the tasks
    return itemsResponse.data.data.boards[0].items_page.items;
  } catch (error) {
    // Step 7: Handle any errors that occur during the process
    console.error('Error fetching Monday.com tasks:', error);
    throw error;
  }
}
