'use server'

export async function getIpInfo(ip: string) {
  if (!ip) {
    return { status: 400, message: 'No IP address provided' }
  }

  const maxRetries = 4;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`)
      const data = await response.json()
      
      if (data.error) {
        retries++;
        if (retries === maxRetries) {
          return { status: 404, message: 'Unable to fetch location data after multiple attempts' }
        }
        // Wait for a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      return {
        status: 200,
        message: 'Success',
        data: {
          ip,
          city: data.city,
          region: data.region,
          country: data.country_name,
          latitude: data.latitude,
          longitude: data.longitude
        }
      }
    } catch (error) {
      console.error('Error fetching IP location:', error)
      retries++;
      if (retries === maxRetries) {
        return { status: 500, message: 'Failed to fetch location data after multiple attempts' }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return { status: 500, message: 'Unexpected error occurred' }
}