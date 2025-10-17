import { client } from "../sanity/lib/client"

export interface Holiday {
  _id: string
  name: string
  startDate: string
  endDate: string
  description?: string
  color?: string
}

export async function getHolidays(year: number): Promise<Holiday[]> {
  const query = `*[_type == "holiday" && 
    startDate >= "${year}-01-01" && 
    startDate <= "${year}-12-31"
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
