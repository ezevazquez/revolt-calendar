import { client } from "../sanity/lib/client"

export interface Holiday {
  _id: string
  name: string
  startDate: string
  endDate: string
  description?: string
  type?: 'inamovible' | 'trasladable' | 'no_laborable' | 'custom'
  status?: 'pending' | 'approved' | 'rejected' | 'working' | 'custom' | 'existing'
  isOfficial?: boolean
  existsInDB?: boolean
}

export async function getHolidays(year: number): Promise<Holiday[]> {
  const query = `*[_type == "holiday" && 
    startDate >= "${year}-01-01" && 
    startDate <= "${year}-12-31" &&
    status in ["approved", "working", "custom"]
  ] | order(startDate asc)`

  try {
    const holidays = await client.fetch(query)
    return holidays
  } catch (error) {
    console.error("Error fetching holidays:", error)
    // Return empty array if there's an error
    return []
  }
}

export async function getPendingHolidays(): Promise<Holiday[]> {
  const query = `*[_type == "holiday" && status == "pending"] | order(startDate asc)`
  
  try {
    return await client.fetch(query)
  } catch (error) {
    console.error("Error fetching pending holidays:", error)
    return []
  }
}

export async function updateHolidayStatus(id: string, status: Holiday['status']): Promise<void> {
  try {
    const response = await fetch('/api/update-holiday', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, status }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error updating holiday status:", error);
    throw error;
  }
}

export async function bulkUpdateHolidayStatus(ids: string[], status: Holiday['status']): Promise<void> {
  try {
    const response = await fetch('/api/bulk-update-holidays', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids, status }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error updating holidays status:", error);
    throw error;
  }
}
