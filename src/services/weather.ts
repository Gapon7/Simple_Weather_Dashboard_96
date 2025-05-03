
'use server';
import { format } from 'date-fns';

/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
  lng: number;
}

/**
 * Represents current weather information, including temperature and conditions.
 * All numerical values related to weather (temp, speed, distance) are stored in metric units (C, km/h, km).
 */
export interface Weather {
  /**
   * The current temperature in Celsius.
   */
  temperature: number;
  /**
   * The minimum temperature for the day in Celsius.
   */
  minTemperature: number;
  /**
   * The maximum temperature for the day in Celsius.
   */
  maxTemperature: number;
  /**
   * The weather conditions (e.g., Sunny, Cloudy, Rainy).
   */
  conditions: string;
    /**
   * The humidity percentage.
   */
  humidity: number;
  /**
   * The wind speed in km/h.
   */
  windSpeed: number;
      /**
   * The AQI Value.
   */
  aqi: number;

  /**
   * The UV index. (Placeholder, often needs separate API call)
   */
  uvIndex: number;

  /**
   * The "feels like" temperature in Celsius.
   */
  feelsLike: number;

  /**
   * The wind direction (e.g., NE, SW).
   */
  windDirection: string;

  /**
   * The air pressure in hPa.
   */
  airPressure: number;

  /**
   * The visibility in kilometers (km).
   */
  visibility: number;

  /**
   * The time of sunrise (local time, formatted string).
   */
  sunrise: string;

  /**
   * The time of sunset (local time, formatted string).
   */
  sunset: string;

  /**
   * The City name.
   */
  city: string;

  /**
   * Icon code from OpenWeatherMap.
   */
   icon: string;
   /**
    * Timezone offset in seconds from UTC
    */
   timezone: number;
}

/**
 * Represents weather forecast information for a single day.
 * All numerical values related to weather (temp, speed) are stored in metric units (C, km/h).
 */
export interface DailyForecastItem {
  date: string; // e.g., "YYYY-MM-DD"
  dayName: string; // e.g., "Monday"
  minTemperature: number; // In Celsius
  maxTemperature: number; // In Celsius
  condition: string;
  icon: string; // Weather icon code from API
  humidity: number; // Average humidity
  windSpeed: number; // Average wind speed in km/h
}

/**
 * Represents weather forecast information for a specific hour.
 * All numerical values related to weather (temp, speed) are stored in metric units (C, km/h).
 */
export interface HourlyForecastItem {
  time: string; // e.g., "14:00"
  temperature: number; // In Celsius
  condition: string;
  icon: string; // Weather icon code from API
  windSpeed: number; // In km/h
}

/**
 * Represents the combined forecast data.
 */
export interface Forecast {
    daily: DailyForecastItem[];
    hourly: HourlyForecastItem[];
}


const apiKey = '652e3461181082abee199b190a1d7afc'; // API key

if (!apiKey) {
  throw new Error("OPENWEATHERMAP_API_KEY is not set.");
}

// Converts degrees to cardinal direction
function degToCompass(num: number): string {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

// Fetches Air Quality Index
async function getAirQuality(lat: number, lon: number): Promise<number> {
  const aqiApiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  try {
    const response = await fetch(aqiApiUrl);
    if (!response.ok) {
      console.error(`AQI API error! status: ${response.status}`);
      return 0; // Return default or handle error appropriately
    }
    const data = await response.json();
    // Basic simulation using PM2.5 - THIS IS NOT AN ACCURATE AQI CALCULATION but provides a scale
    const pm2_5 = data.list[0]?.components?.pm2_5 || 0;
    if (pm2_5 <= 12) return Math.round(pm2_5 * (50/12)); // Good
    if (pm2_5 <= 35) return Math.round(50 + (pm2_5 - 12) * (50/23)); // Moderate
    if (pm2_5 <= 55) return Math.round(100 + (pm2_5 - 35) * (50/20)); // Unhealthy for Sensitive Groups
    if (pm2_5 <= 150) return Math.round(150 + (pm2_5 - 55) * (50/95)); // Unhealthy
    if (pm2_5 <= 250) return Math.round(200 + (pm2_5 - 150) * (100/100)); // Very Unhealthy
    return 301; // Hazardous
  } catch (error) {
    console.error("Failed to fetch air quality data:", error);
    return 0; // Return default or handle error
  }
}

// Converts meters to kilometers
function formatVisibilityToKm(visibilityMeters: number): number {
    return Math.round(visibilityMeters / 1000); // km
}

// Formats time based on timezone offset
function formatTimezone(timestamp: number, timezoneOffsetSeconds: number): string {
    const date = new Date((timestamp + timezoneOffsetSeconds) * 1000);
    // Format to IST (Indian Standard Time)
    return date.toLocaleTimeString('en-IN', { // Use en-IN for IST formatting
        timeZone: 'Asia/Kolkata', // Explicitly set timezone to IST
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // Use 12-hour format with AM/PM for IST
    });
}

// Converts wind speed from m/s (API default) to km/h
function convertWindSpeedToKmh(speedMs: number): number {
    return Math.round(speedMs * 3.6);
}


/**
 * Asynchronously retrieves current weather information for a given location, always using metric units for the API call.
 *
 * @param city The city name.
 * @returns A promise resolving to a Weather object (with values in metric units).
 */
export async function getWeather(city: string): Promise<Weather>;
/**
 * Asynchronously retrieves current weather information for given coordinates, always using metric units for the API call.
 *
 * @param latitude The latitude.
 * @param longitude The longitude.
 * @returns A promise resolving to a Weather object (with values in metric units).
 */
export async function getWeather(latitude: number, longitude: number): Promise<Weather>;
export async function getWeather(arg1: string | number, arg2?: number): Promise<Weather> {

  let currentApiUrl: string;
  let lat: number | null = null;
  let lon: number | null = null;
  const units: 'metric' = 'metric'; // Always use metric for API calls

  if (typeof arg1 === 'string') {
    currentApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(arg1)}&appid=${apiKey}&units=${units}`;
  } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
    lat = arg1;
    lon = arg2;
    currentApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
  } else {
     console.error("Invalid arguments passed to getWeather:", { arg1, arg2 });
     throw new Error("Invalid arguments: Provide city name, or latitude and longitude.");
  }

  try {
    const response = await fetch(currentApiUrl);
    if (!response.ok) {
       const errorData = await response.json();
       console.error("OpenWeatherMap API Error:", errorData);
       throw new Error(`City not found or API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    // Ensure lat/lon are set for AQI call
    if (lat === null || lon === null) {
        lat = data.coord.lat;
        lon = data.coord.lon;
    }

    // Ensure lat and lon are valid numbers before calling getAirQuality
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
         console.error("Invalid coordinates for AQI call:", { lat, lon });
         throw new Error("Could not determine valid coordinates for the location.");
    }

    const aqi = await getAirQuality(lat, lon);
    const timezoneOffset = data.timezone; // Timezone offset from UTC in seconds

    // API provides speed in m/s with metric units, convert to km/h
    const windSpeedKmh = convertWindSpeedToKmh(data.wind.speed);
    // API provides visibility in meters, convert to km
    const visibilityKm = formatVisibilityToKm(data.visibility);

    const weather: Weather = {
      temperature: Math.round(data.main.temp), // Celsius
      minTemperature: Math.round(data.main.temp_min), // Celsius
      maxTemperature: Math.round(data.main.temp_max), // Celsius
      conditions: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: windSpeedKmh, // km/h
      aqi: aqi,
      uvIndex: 0, // Placeholder
      feelsLike: Math.round(data.main.feels_like), // Celsius
      windDirection: degToCompass(data.wind.deg),
      airPressure: data.main.pressure,
      visibility: visibilityKm, // km
      sunrise: formatTimezone(data.sys.sunrise, timezoneOffset), // Formatted IST string
      sunset: formatTimezone(data.sys.sunset, timezoneOffset), // Formatted IST string
      city: data.name,
      icon: data.weather[0].icon,
      timezone: timezoneOffset,
    };

    return weather;
  } catch (error: any) {
    console.error("Failed to fetch current weather data:", error);
    throw new Error(error.message || "Failed to fetch current weather data");
  }
}


/**
 * Asynchronously retrieves 5-day daily and hourly forecast information, always using metric units for the API call.
 *
 * @param city The city name.
 * @returns A promise resolving to a Forecast object (with values in metric units).
 */
export async function getForecast(city: string): Promise<Forecast>;
/**
 * Asynchronously retrieves 5-day daily and hourly forecast information for given coordinates, always using metric units for the API call.
 *
 * @param latitude The latitude.
 * @param longitude The longitude.
 * @returns A promise resolving to a Forecast object (with values in metric units).
 */
export async function getForecast(latitude: number, longitude: number): Promise<Forecast>;
export async function getForecast(arg1: string | number, arg2?: number): Promise<Forecast> {

  let forecastApiUrl: string;
  const units: 'metric' = 'metric'; // Always use metric for API calls

  if (typeof arg1 === 'string') {
    forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(arg1)}&appid=${apiKey}&units=${units}`;
  } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
    forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${arg1}&lon=${arg2}&appid=${apiKey}&units=${units}`;
  } else {
    console.error("Invalid arguments passed to getForecast:", { arg1, arg2 });
    throw new Error("Invalid arguments: Provide city name, or latitude and longitude.");
  }

  try {
    const response = await fetch(forecastApiUrl);
     if (!response.ok) {
       const errorData = await response.json();
       console.error("OpenWeatherMap Forecast API Error:", errorData);
       throw new Error(`City not found or API error in forecast: ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    const timezoneOffset = data.city.timezone; // Get timezone offset from city data

    // --- Process Hourly Forecast ---
    const hourlyForecast: HourlyForecastItem[] = data.list.slice(0, 12).map((item: any) => {
        // API gives speed in m/s, convert to km/h
        const windSpeedKmh = convertWindSpeedToKmh(item.wind.speed);
        return {
            time: formatTimezone(item.dt, timezoneOffset).substring(0, 5), // Get HH:MM (from IST formatted string)
            temperature: Math.round(item.main.temp), // Celsius
            condition: item.weather[0].main,
            icon: item.weather[0].icon,
            windSpeed: windSpeedKmh, // km/h
        };
    });


    // --- Process Daily Forecast ---
    const dailyData: { [key: string]: { minTemps: number[], maxTemps: number[], humidities: number[], windSpeedsMetricMs: number[], conditions: { [cond: string]: number }, icons: { [icon: string]: number } } } = {};

    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0]; // Get YYYY-MM-DD
      if (!dailyData[date]) {
        dailyData[date] = { minTemps: [], maxTemps: [], humidities: [], windSpeedsMetricMs: [], conditions: {}, icons: {} };
      }
      dailyData[date].minTemps.push(item.main.temp_min);
      dailyData[date].maxTemps.push(item.main.temp_max);
      dailyData[date].humidities.push(item.main.humidity);
      dailyData[date].windSpeedsMetricMs.push(item.wind.speed); // Store raw metric speed (m/s)

      const condition = item.weather[0].main;
      dailyData[date].conditions[condition] = (dailyData[date].conditions[condition] || 0) + 1;

      const icon = item.weather[0].icon;
       dailyData[date].icons[icon] = (dailyData[date].icons[icon] || 0) + 1;
    });

    const dailyForecast: DailyForecastItem[] = Object.keys(dailyData).slice(0, 5).map(date => {
      const dayInfo = dailyData[date];
      const minTemp = Math.round(Math.min(...dayInfo.minTemps)); // Celsius
      const maxTemp = Math.round(Math.max(...dayInfo.maxTemps)); // Celsius
      const avgHumidity = Math.round(dayInfo.humidities.reduce((a, b) => a + b, 0) / dayInfo.humidities.length);

      // Calculate average wind speed in m/s and convert to km/h
      const avgWindSpeedMs = dayInfo.windSpeedsMetricMs.reduce((a, b) => a + b, 0) / dayInfo.windSpeedsMetricMs.length;
      const avgWindSpeedKmh = convertWindSpeedToKmh(avgWindSpeedMs); // km/h


      const mostFrequentCondition = Object.keys(dayInfo.conditions).reduce((a, b) => dayInfo.conditions[a] > dayInfo.conditions[b] ? a : b, 'Clear');
      const mostFrequentIcon = Object.keys(dayInfo.icons).reduce((a, b) => dayInfo.icons[a] > dayInfo.icons[b] ? a : b, '01d');

      const dateObj = new Date(date + 'T00:00:00Z'); // Use UTC for date object creation
      const dayName = format(dateObj, 'EEEE');

      return {
        date: date,
        dayName: dayName,
        minTemperature: minTemp, // Celsius
        maxTemperature: maxTemp, // Celsius
        condition: mostFrequentCondition,
        icon: mostFrequentIcon,
        humidity: avgHumidity,
        windSpeed: avgWindSpeedKmh // km/h
      };
    });

    return { daily: dailyForecast, hourly: hourlyForecast };

  } catch (error: any) {
    console.error("Failed to fetch forecast data:", error);
     throw new Error(error.message || "Failed to fetch forecast data");
  }
}
