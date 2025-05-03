
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getWeather, getForecast, Weather, DailyForecastItem, HourlyForecastItem, Forecast } from "@/services/weather";
import { cn } from "@/lib/utils";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Haze,
  Info,
  Loader2,
  Locate,
  Search,
  Sun,
  Thermometer,
  Tornado,
  Wind,
  Sunrise,
  Sunset,
  Eye,
  Droplets,
  Gauge,
  CalendarDays,
  Globe,
  Newspaper,
  ExternalLink,
  Menu,
  Clock, // For hourly forecast time
  MoveHorizontal, // Icon for horizontal scroll hint
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch"; // Import Switch
import { Label } from "@/components/ui/label"; // Import Label
import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

// --- Unit Type Definition ---
type TemperatureUnit = 'Celsius' | 'Fahrenheit';
type SpeedUnit = 'km/h' | 'mph';

// --- Unit Conversion Functions ---
const celsiusToFahrenheit = (celsius: number): number => Math.round((celsius * 9/5) + 32);
const fahrenheitToCelsius = (fahrenheit: number): number => Math.round((fahrenheit - 32) * 5/9);
const kmhToMph = (kmh: number): number => Math.round(kmh / 1.60934);
const mphToKmh = (mph: number): number => Math.round(mph * 1.60934);
const kmToMiles = (km: number): number => Math.round(km / 1.609);
const milesToKm = (miles: number): number => Math.round(miles * 1.609);

// --- Weather Icon Component (No changes needed) ---
const WeatherIcon = ({ condition, iconCode, size = "lg" }: { condition: string, iconCode?: string, size?: 'sm' | 'lg' | 'xl' }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    lg: "w-16 h-16",
    xl: "w-24 h-24", // Added larger size
  };
  const iconClass = sizeClasses[size] || sizeClasses.lg;
  // Use text-foreground for default icon color within dynamic background sections for better contrast
  const defaultColor = "text-foreground";

  // Prioritize icon code for accuracy
  if (iconCode) {
    switch (iconCode.substring(0, 2)) {
      case '01': return <Sun className={cn(iconClass, "text-yellow-400")} />;
      case '02': return <CloudSun className={cn(iconClass, "text-gray-400")} />; // Slightly muted cloud for contrast
      case '03': return <Cloud className={cn(iconClass, "text-gray-400")} />;
      case '04': return <Cloud className={cn(iconClass, "text-gray-500")} />; // Darker cloud for distinction
      case '09': return <CloudRain className={cn(iconClass, "text-blue-300")} />; // Lighter blue for dark bg
      case '10': return <CloudDrizzle className={cn(iconClass, "text-blue-200")} />; // Lighter blue
      case '11': return <CloudLightning className={cn(iconClass, "text-yellow-300")} />; // Lighter yellow
      case '13': return <CloudSnow className={cn(iconClass, "text-white")} />; // White for contrast
      case '50': return <CloudFog className={cn(iconClass, "text-gray-300")} />; // Lighter gray
      default:   return <Sun className={cn(iconClass, "text-yellow-400")} />; // Fallback
    }
  }

  // Fallback to condition string if no icon code
  switch (condition?.toLowerCase()) {
    case "clear":
    case "sunny": return <Sun className={cn(iconClass, "text-yellow-400")} />;
    case "clouds": return <Cloud className={cn(iconClass, "text-gray-400")} />;
    case "rain": return <CloudRain className={cn(iconClass, "text-blue-300")} />;
    case "drizzle": return <CloudDrizzle className={cn(iconClass, "text-blue-200")} />;
    case "thunderstorm": return <CloudLightning className={cn(iconClass, "text-yellow-300")} />;
    case "snow": return <CloudSnow className={cn(iconClass, "text-white")} />;
    case "mist": case "smoke": case "haze": case "dust": case "fog": case "sand": case "ash": case "squall": return <CloudFog className={cn(iconClass, "text-gray-300")} />;
    case "tornado": return <Tornado className={cn(iconClass, "text-gray-400")} />;
    default: return <Sun className={cn(iconClass, "text-yellow-400")} />; // Fallback
  }
};

// --- Daily Forecast Card ---
const DailyForecastCard = ({ forecast, tempUnit }: { forecast: DailyForecastItem; tempUnit: TemperatureUnit }) => {
  const displayMinTemp = tempUnit === 'Fahrenheit' ? celsiusToFahrenheit(forecast.minTemperature) : forecast.minTemperature;
  const displayMaxTemp = tempUnit === 'Fahrenheit' ? celsiusToFahrenheit(forecast.maxTemperature) : forecast.maxTemperature;
  const tempSymbol = tempUnit === 'Fahrenheit' ? '°F' : '°C';
  const speedSymbol = tempUnit === 'Fahrenheit' ? 'mph' : 'km/h'; // Units correspond: F with mph, C with km/h
  const displayWindSpeed = tempUnit === 'Fahrenheit' ? kmhToMph(forecast.windSpeed) : forecast.windSpeed; // Convert speed based on temp unit

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="forecast-card">
            <div className="forecast-card-title">{forecast.dayName}</div>
            <div className="flex justify-center my-2">
              <WeatherIcon condition={forecast.condition} iconCode={forecast.icon} size="sm" />
            </div>
            <div className="forecast-temperature">
              {displayMaxTemp}° <span className="text-muted-foreground text-xs">/ {displayMinTemp}{tempSymbol}</span>
            </div>
            <div className="forecast-description">{forecast.condition}</div>
          </Card>
        </TooltipTrigger>
        {/* Popup styles updated */}
        <TooltipContent className="font-bold text-black bg-background border border-border rounded shadow-lg p-2">
           <p><strong>{forecast.dayName} ({forecast.date})</strong></p>
           <p>Condition: {forecast.condition}</p>
           <p>High: {displayMaxTemp}{tempSymbol}, Low: {displayMinTemp}{tempSymbol}</p>
           <p>Humidity: {forecast.humidity}%</p>
           <p>Wind: {displayWindSpeed} {speedSymbol}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// --- Hourly Forecast Card ---
const HourlyForecastCard = ({ forecast, tempUnit, speedUnit }: { forecast: HourlyForecastItem; tempUnit: TemperatureUnit; speedUnit: SpeedUnit }) => {
    const displayTemp = tempUnit === 'Fahrenheit' ? celsiusToFahrenheit(forecast.temperature) : forecast.temperature;
    const displayWindSpeed = speedUnit === 'mph' ? kmhToMph(forecast.windSpeed) : forecast.windSpeed;
    const tempSymbol = tempUnit === 'Fahrenheit' ? '°F' : '°C';
    const speedSymbol = speedUnit === 'mph' ? 'mph' : 'km/h';

    return (
        <Card className="hourly-forecast-card">
            <div className="text-xs font-medium text-muted-foreground mb-1">{forecast.time}</div>
            <div className="flex justify-center my-1">
                <WeatherIcon condition={forecast.condition} iconCode={forecast.icon} size="sm" />
            </div>
            <div className="text-lg font-bold text-accent">{displayTemp}{tempSymbol}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center">
                <Wind className="w-3 h-3 mr-1" /> {displayWindSpeed} {speedSymbol}
            </div>
        </Card>
    );
};

// --- Weather Alerts Component ---
const WeatherAlerts = ({ weather, loading }: { weather: Weather | null, loading: boolean }) => {
    const getAlertConfig = useCallback((w: Weather) => {
        // Use Celsius for threshold logic as API data is always metric
        const tempMaxC = w.maxTemperature;
        const tempMinC = w.minTemperature;
        const windSpeedKmh = w.windSpeed; // Already in km/h from service
        const visibilityKm = w.visibility; // Already in km from service

        const alerts = [
            { condition: "Heavy Rain", message: "Heavy rainfall expected. Potential flooding.", trigger: w.conditions.toLowerCase().includes("heavy rain") },
            { condition: "Moderate Rain", message: "Moderate rain likely. Carry an umbrella!", trigger: w.conditions.toLowerCase().includes("moderate rain")},
            { condition: "Light Rain/Drizzle", message: "Light rain or drizzle possible. Roads might be slippery.", trigger: w.conditions.toLowerCase().includes("drizzle") || w.conditions.toLowerCase().includes("light rain")},
            { condition: "Thunderstorm", message: "Thunderstorms likely. Seek shelter if outdoors.", trigger: w.conditions.toLowerCase().includes("thunderstorm") },
            { condition: "Heatwave", message: "Extreme heat warning! Stay hydrated & avoid sun.", trigger: tempMaxC > 35 },
            { condition: "High Temperature", message: "High temperatures expected. Stay cool.", trigger: tempMaxC > 30 && tempMaxC <= 35 },
            { condition: "Cold Snap", message: "Very low temperatures expected. Protect pipes.", trigger: tempMinC < 0 },
            { condition: "Low Temperature", message: "Low temperatures expected tonight. Dress warmly.", trigger: tempMinC < 10 && tempMinC >= 0 },
            { condition: "Strong Wind", message: "Strong winds expected. Secure loose objects.", trigger: windSpeedKmh > 50 },
            { condition: "Fog/Mist", message: "Dense fog/mist reducing visibility. Drive carefully.", trigger: (w.conditions.toLowerCase().includes("fog") || w.conditions.toLowerCase().includes("mist")) && visibilityKm < 1 },
            { condition: "Snow", message: "Snowfall expected. Travel may be disrupted.", trigger: w.conditions.toLowerCase().includes("snow") },
            { condition: "Hazardous AQI", message: "Air quality is hazardous! Avoid outdoor activity.", trigger: w.aqi > 300 },
            { condition: "Very Unhealthy AQI", message: "Air quality very unhealthy. Avoid prolonged exertion.", trigger: w.aqi > 200 && w.aqi <= 300 },
            { condition: "Unhealthy AQI", message: "Air quality is unhealthy. Limit outdoor activity.", trigger: w.aqi > 150 && w.aqi <= 200 },
            { condition: "Unhealthy (Sensitive) AQI", message: "AQI unhealthy for sensitive groups. Limit exertion.", trigger: w.aqi > 100 && w.aqi <= 150 },
            { condition: "Moderate AQI", message: "Air quality moderate. Consider reducing exposure.", trigger: w.aqi > 50 && w.aqi <= 100 },
        ];

        const active = alerts.filter(a => a.trigger);
        if (active.length > 0) return active;

        // Default message if no specific alerts
        return [{ condition: "Good Weather", message: "Enjoy the pleasant weather conditions!", trigger: true }];
    }, []);


  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [relevantAlerts, setRelevantAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (weather) {
      const activeAlertMessages = getAlertConfig(weather).map(alert => alert.message);
      setRelevantAlerts(activeAlertMessages);
      setCurrentAlertIndex(0);
    } else {
      setRelevantAlerts([]);
    }
  }, [weather, getAlertConfig]);

  useEffect(() => {
    if (relevantAlerts.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentAlertIndex((prevIndex) => (prevIndex + 1) % relevantAlerts.length);
      }, 5000); // Change message every 5 seconds
      return () => clearInterval(intervalId);
    }
  }, [relevantAlerts]);

   if (loading) { // Show loading state if loading is true
     return (
        <div className="section-container text-center text-muted-foreground">
          Loading alerts...
        </div>
     );
   }

  if (!weather || relevantAlerts.length === 0) { // Show no alerts if weather is null or no relevant alerts
     return (
       <div className="section-container text-center text-muted-foreground">
         No weather alerts at the moment.
       </div>
    );
  }


  return (
    <div className="section-container">
      <h2 className="section-title mb-3">Weather Alerts</h2>
      <div className="alert-container">
        {relevantAlerts.map((alert, index) => (
          <p
            key={index}
            className={cn(
              "alert-text",
               // Bold and black text for popup
               "font-bold text-black",
              index === currentAlertIndex ? "translate-x-0 opacity-100" : "opacity-0",
              index < currentAlertIndex ? "-translate-x-full" : "translate-x-full" // Adjusted for smoother slide
            )}
            style={{
                transform: index === currentAlertIndex
                    ? 'translateX(0)'
                    : (index < currentAlertIndex ? 'translateX(-100%)' : 'translateX(100%)'),
                transition: 'transform 0.7s ease-in-out, opacity 0.7s ease-in-out' // Consistent transition
             }}
          >
            {alert}
          </p>
        ))}
      </div>
    </div>
  );
};

// --- AQI Style Utility ---
const getAqiStyle = (aqi: number) => {
  if (aqi <= 50) return { level: "Good", color: "text-green-600", bgColor: "bg-green-100" };
  if (aqi <= 100) return { level: "Moderate", color: "text-yellow-600", bgColor: "bg-yellow-100" };
  if (aqi <= 150) return { level: "Unhealthy (Sensitive)", color: "text-orange-600", bgColor: "bg-orange-100" };
  if (aqi <= 200) return { level: "Unhealthy", color: "text-red-600", bgColor: "bg-red-100" };
  if (aqi <= 300) return { level: "Very Unhealthy", color: "text-purple-600", bgColor: "bg-purple-100" };
  return { level: "Hazardous", color: "text-red-800", bgColor: "bg-red-200" };
};

// --- Weather Theme Utility for Backgrounds ---
const getWeatherThemeClass = (conditionCode?: string, isSection: boolean = false): string => {
    const baseClasses = "transition-colors duration-500 ease-in-out";
    let themeClass = 'bg-gradient-to-br from-blue-100 to-blue-300'; // Default

    if (conditionCode) {
        const codePrefix = conditionCode.substring(0, 2);
        switch (codePrefix) {
            case '01': // Clear sky
                themeClass = 'bg-gradient-to-br from-yellow-200 via-orange-200 to-orange-300'; // Yellow/Orange Gradient
                 if (isSection) themeClass += ' text-gray-800'; // Ensure dark text on light background
                 break;
            case '02': // Few clouds
            case '03': // Scattered clouds
            case '04': // Broken clouds / Overcast
                themeClass = 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400'; // Light Grey/Silver
                 if (isSection) themeClass += ' text-gray-800'; // Ensure dark text
                break;
            case '09': // Shower rain
            case '10': // Rain
                themeClass = 'bg-gradient-to-br from-blue-700 via-blue-800 to-gray-900'; // Dark Blue/Navy/Grey
                 if (isSection) themeClass += ' text-white'; // Ensure light text
                break;
            case '11': // Thunderstorm
                themeClass = 'bg-gradient-to-br from-purple-800 via-gray-800 to-black'; // Dark Purple/Charcoal
                 if (isSection) themeClass += ' text-white'; // Ensure light text
                break;
            case '13': // Snow
                themeClass = 'bg-gradient-to-br from-blue-100 via-white to-blue-200'; // Soft Blue/White
                 if (isSection) themeClass += ' text-gray-700'; // Ensure dark text
                break;
            case '50': // Mist/Fog
                 themeClass = 'bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500'; // Similar to cloudy
                 if (isSection) themeClass += ' text-gray-800'; // Ensure dark text
                 break;
            default: // Default / Unknown
                themeClass = 'bg-gradient-to-br from-blue-100 to-blue-300';
                if (isSection) themeClass += ' text-gray-700';
                break;
        }
    } else if (isSection) {
         // Default section background if no weather data
         themeClass = 'bg-card text-card-foreground'; // Use default card styling
    }


    return cn(baseClasses, themeClass);
};


// --- Main Home Component ---
export default function Home() {
  const [city, setCity] = useState("Bengaluru");
  const [searchQuery, setSearchQuery] = useState("");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null); // Updated state type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });
  // Use state for units within the component for reactivity
  const [componentTempUnit, setComponentTempUnit] = useState<TemperatureUnit>('Celsius');
  const [componentSpeedUnit, setComponentSpeedUnit] = useState<SpeedUnit>('km/h');
  const apiUnits: 'metric' = 'metric'; // API calls will always use metric


  // --- Unit Conversion Logic ---
  // Only toggle frontend display units, no API refetch needed
  const toggleUnits = () => {
    const newTempUnit = componentTempUnit === 'Celsius' ? 'Fahrenheit' : 'Celsius';
    const newSpeedUnit = componentSpeedUnit === 'km/h' ? 'mph' : 'km/h';

    setComponentTempUnit(newTempUnit);
    setComponentSpeedUnit(newSpeedUnit);
  };


  // --- Data Fetching ---
   const fetchWeatherData = useCallback(async (location: string | { lat: number; lon: number }) => {
        setLoading(true);
        setError(null);
        let currentCityName: string;
        const units = 'metric'; // Always fetch in metric

        // Reset userLocation if searching by city name, unless location is already set and matches weather city
        if (typeof location === 'string' && (!userLocation.lat || !weather || !weather.city.includes('Lat:'))) {
             setUserLocation({ lat: null, lon: null });
        }

        try {
           let currentWeatherData: Weather;
           let forecastData: Forecast;

           if (typeof location === 'string') {
             if (!location.trim()) throw new Error("Please enter a city name.");
             currentWeatherData = await getWeather(location.trim(), units);
             forecastData = await getForecast(location.trim(), units);
             currentCityName = currentWeatherData.city || location.trim();
             setCity(currentCityName); // Set city name from API response
           } else if (location && typeof location.lat === 'number' && typeof location.lon === 'number') {
             currentWeatherData = await getWeather(location.lat, location.lon, units);
             forecastData = await getForecast(location.lat, location.lon, units);
             currentCityName = currentWeatherData.city || `Lat: ${location.lat.toFixed(2)}, Lon: ${location.lon.toFixed(2)}`;
             // Keep userLocation state when fetching by coords
             setUserLocation({ lat: location.lat, lon: location.lon });
             setCity(currentCityName); // Set display name for coords
           } else {
             throw new Error("Invalid location provided.");
           }
           setWeather(currentWeatherData);
           setForecast(forecastData);
           setSearchQuery(""); // Clear search query after successful fetch
        } catch (e: any) {
          setError(e.message || "Failed to fetch weather data.");
          console.error(e);
          setWeather(null);
          setForecast(null);
        } finally {
          setLoading(false);
        }
    }, [weather]); // Add weather dependency for city name check

   // --- Initial Load Effect ---
  useEffect(() => {
    const fetchInitial = () => {
        setLoading(true);
        const fetchDefault = () => fetchWeatherData(city); // Use default city 'Bengaluru', always fetches metric

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    fetchWeatherData({ lat, lon }); // Fetch with coords, always metric
                },
                (geoError) => {
                    console.warn("Geolocation error:", geoError.message, ". Falling back to default city.");
                    setError(null); // Clear previous errors
                    fetchDefault();
                },
                { timeout: 5000 }
            );
        } else {
            console.warn("Geolocation not supported. Loading default city.");
            fetchDefault();
        }
    };
    fetchInitial();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed fetchWeatherData dependency


  // --- Event Handlers ---
  const handleSearch = () => {
    if (searchQuery.trim()) {
       fetchWeatherData(searchQuery.trim()); // Always fetches metric
    } else {
        setError("Please enter a city name to search.");
    }
  };

  const handleLocationSearch = () => {
    setLoading(true);
    setError(null);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherData({ lat, lon }); // Always fetches metric
            },
            (geoError) => {
                console.error("Error getting user location:", geoError);
                setError("Failed to get location. Please enable services or search manually.");
                setLoading(false);
            },
            { timeout: 5000 }
        );
    } else {
        setError("Geolocation is not supported by your browser.");
        setLoading(false);
    }
};


  // --- Render Logic ---
  const aqiInfo = weather ? getAqiStyle(weather.aqi) : null;
  // Display temperatures based on selected unit from state, converting from Celsius data
  const displayTemp = weather ? (componentTempUnit === 'Fahrenheit' ? celsiusToFahrenheit(weather.temperature) : weather.temperature) : 0;
  const displayMinTemp = weather ? (componentTempUnit === 'Fahrenheit' ? celsiusToFahrenheit(weather.minTemperature) : weather.minTemperature) : 0;
  const displayMaxTemp = weather ? (componentTempUnit === 'Fahrenheit' ? celsiusToFahrenheit(weather.maxTemperature) : weather.maxTemperature) : 0;
  const displayFeelsLike = weather ? (componentTempUnit === 'Fahrenheit' ? celsiusToFahrenheit(weather.feelsLike) : weather.feelsLike) : 0;
  const tempSymbol = componentTempUnit === 'Fahrenheit' ? '°F' : '°C';

  // Display wind speed based on selected unit from state, converting from km/h data
  const displayWindSpeed = weather ? (componentSpeedUnit === 'mph' ? kmhToMph(weather.windSpeed) : weather.windSpeed) : 0;
  const speedSymbol = componentSpeedUnit === 'mph' ? 'mph' : 'km/h';

  // Display visibility based on selected unit, converting from km data
  const displayVisibility = weather ? (componentSpeedUnit === 'mph' ? kmToMiles(weather.visibility) : weather.visibility) : 0;
  const visibilitySymbol = componentSpeedUnit === 'mph' ? 'miles' : 'km';

  const newsSites = [
    { name: "Yale Climate Connections", url: "https://yaleclimateconnections.org/", icon: <Globe className="w-4 h-4 mr-2"/> },
    { name: "Weather.com News", url: "https://weather.com/news", icon: <Newspaper className="w-4 h-4 mr-2"/> },
    { name: "NOAA News", url: "https://www.noaa.gov/news", icon: <Cloud className="w-4 h-4 mr-2"/> },
    { name: "Climate.gov News", url: "https://www.climate.gov/news-features", icon: <Thermometer className="w-4 h-4 mr-2"/> },
    { name: "AccuWeather News", url: "https://www.accuweather.com/en/weather-news", icon: <Sun className="w-4 h-4 mr-2"/> },
    { name: "The Guardian Weather", url: "https://www.theguardian.com/us/environment/weather", icon: <Newspaper className="w-4 h-4 mr-2"/> },
  ];

  // Dynamic background class for the main container (dashboard)
  const dashboardBackgroundClass = getWeatherThemeClass(weather?.icon, false);
  // Dynamic background class for the specific weather info section
  const weatherInfoSectionClass = getWeatherThemeClass(weather?.icon, true);


  return (
    <SidebarProvider>
        <Sidebar side="right">
            <SidebarHeader>
                 <h2 className="text-lg font-semibold flex items-center text-sidebar-primary">
                    <Newspaper className="mr-2 h-5 w-5" />
                     Weather News Sources
                 </h2>
            </SidebarHeader>
             <SidebarContent>
                 <SidebarMenu>
                     {newsSites.map((site) => (
                         <SidebarMenuItem key={site.name}>
                            <a href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-center w-full p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                                {site.icon && React.cloneElement(site.icon, { className: cn(site.icon.props.className, "text-sidebar-primary") })}
                                <span className="ml-2">{site.name}</span>
                                <ExternalLink className="ml-auto h-4 w-4 opacity-70" />
                            </a>
                         </SidebarMenuItem>
                     ))}
                 </SidebarMenu>
            </SidebarContent>
        </Sidebar>

        <SidebarInset>
            {/* Apply dynamic background and transitions to the overall dashboard */}
            <div className={cn("dashboard-container", dashboardBackgroundClass)}>
              <div className="section-container w-full max-w-4xl mb-6">
                 <div className="flex justify-between items-center mb-4">
                     <h1 className="text-3xl md:text-4xl font-bold text-primary">Weather Dashboard</h1> {/* Use primary color */}
                     <div className="flex items-center space-x-2">
                        {/* Unit Switcher */}
                        <div className="flex items-center space-x-2 bg-card p-1.5 rounded-full border border-border shadow-sm">
                            <Label htmlFor="unit-switch" className="text-xs font-medium text-muted-foreground px-1">
                                °C / °F
                            </Label>
                            <Switch
                                id="unit-switch"
                                checked={componentTempUnit === 'Fahrenheit'} // Use component state variable
                                onCheckedChange={toggleUnits}
                                aria-label="Toggle temperature units"
                            />
                        </div>
                         <SidebarTrigger asChild className="md:hidden">
                             <Button variant="ghost" size="icon"><Menu /></Button>
                        </SidebarTrigger>
                         <SidebarTrigger className="hidden md:flex"/>
                     </div>
                 </div>

                <div className="search-container">
                  <Search className="search-icon" />
                  <Input
                    type="text"
                    placeholder="Search city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    className="search-input"
                    aria-label="Search for a city"
                  />
                  <Button onClick={handleSearch} className="search-button" aria-label="Search">
                    <Search className="mr-2 h-4 w-4"/> Search
                  </Button>
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button onClick={handleLocationSearch} variant="outline" size="icon" className="location-button" aria-label="Use my location">
                            <Locate className="h-5 w-5"/>
                         </Button>
                      </TooltipTrigger>
                      <TooltipContent className="font-bold text-black bg-background border border-border rounded shadow-lg p-2">
                         <p>Use My Location</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {error && <div className="error-message text-center mt-2">{error}</div>}
              </div>

              {loading && (
                  <div className="flex justify-center items-center mt-10 section-container w-full max-w-4xl">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                     <span className="ml-4 text-xl text-muted-foreground">Loading weather data...</span>
                  </div>
                )}

              {!loading && weather && (
                <>
                  {/* Main Weather Info - Apply dynamic background here */}
                  <div className={cn("section-container w-full max-w-4xl mb-6", weatherInfoSectionClass)}>
                     <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center">
                            {/* Larger Icon */}
                            <WeatherIcon condition={weather.conditions} iconCode={weather.icon} size="xl"/>
                            <div className="ml-4 md:ml-6">
                              <h2 className="city-name">{city}</h2>
                              {/* Apply foreground text color for readability on dynamic bg */}
                              <div className="temperature text-foreground">{displayTemp}{tempSymbol}</div>
                               {/* Apply foreground text color */}
                               <div className="text-sm text-foreground opacity-90">
                                  Min: {displayMinTemp}{tempSymbol} / Max: {displayMaxTemp}{tempSymbol}
                               </div>
                               {/* Apply foreground text color */}
                              <p className="text-lg text-foreground capitalize">{weather.conditions}</p>
                            </div>
                        </div>

                         <div className="flex flex-col items-center md:items-end text-right mt-4 md:mt-0">
                             {aqiInfo && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             {/* Ensure AQI text is readable */}
                                            <div className={cn( "flex items-center mb-1 p-1 rounded cursor-help", aqiInfo.bgColor )}>
                                                <span className="text-sm font-semibold mr-1">AQI:</span>
                                                <span className={cn("text-sm font-bold", aqiInfo.color)}>
                                                    {weather.aqi}
                                                </span>
                                                <span className={cn("text-xs font-medium ml-1", aqiInfo.color)}>
                                                   ({aqiInfo.level})
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                         {/* Popup styles updated */}
                                        <TooltipContent className="font-bold text-black bg-background border border-border rounded shadow-lg p-2">
                                            <p>Air Quality Index: {weather.aqi} ({aqiInfo.level})</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                             {/* Apply foreground text color */}
                             <p className="text-sm text-foreground opacity-90 mt-1">Feels like: {displayFeelsLike}{tempSymbol}</p>
                        </div>
                     </div>
                  </div>

                  {/* Weather Alerts Section */}
                  <WeatherAlerts weather={weather} loading={loading}/>

                   {/* Hourly Forecast */}
                   {forecast && forecast.hourly.length > 0 && (
                        <div className="section-container w-full max-w-4xl mb-6">
                            <h2 className="section-title mb-4">Hourly Forecast (Next 12 Hours)</h2>
                            <div className="hourly-forecast-grid">
                                {forecast.hourly.map((hourForecast, index) => (
                                    <HourlyForecastCard key={index} forecast={hourForecast} tempUnit={componentTempUnit} speedUnit={componentSpeedUnit} />
                                ))}
                                {/* Optional: Add a visual hint for scrollability on small screens */}
                                <div className="hidden sm:flex absolute right-0 top-1/2 transform -translate-y-1/2 items-center justify-center p-2 bg-gradient-to-l from-card to-transparent pointer-events-none">
                                     <MoveHorizontal className="w-5 h-5 text-muted-foreground opacity-50" />
                                </div>
                            </div>
                        </div>
                    )}

                  {/* Weather Details */}
                  <div className="section-container w-full max-w-4xl mb-6">
                     <h2 className="section-title mb-4">Current Details</h2>
                    <div className="weather-details">
                      <div className="detail-item">
                         <Droplets className="w-5 h-5 mr-2 text-blue-500"/>
                        <span className="detail-label">Humidity:</span>
                        <span className="detail-value">{weather.humidity}%</span>
                      </div>
                      <div className="detail-item">
                         <Wind className="w-5 h-5 mr-2 text-gray-500"/>
                        <span className="detail-label">Wind Speed:</span>
                        <span className="detail-value">{displayWindSpeed} {speedSymbol} ({weather.windDirection})</span>
                      </div>
                      <div className="detail-item">
                         <Eye className="w-5 h-5 mr-2 text-gray-500"/>
                        <span className="detail-label">Visibility:</span>
                        <span className="detail-value">{displayVisibility} {visibilitySymbol}</span>
                      </div>
                      <div className="detail-item">
                        <Gauge className="w-5 h-5 mr-2 text-red-500"/>
                        <span className="detail-label">Air Pressure:</span>
                        <span className="detail-value">{weather.airPressure} hPa</span>
                      </div>
                      <div className="detail-item">
                        <Sunrise className="w-5 h-5 mr-2 text-orange-400"/>
                        <span className="detail-label">Sunrise:</span>
                        <span className="detail-value">{weather.sunrise}</span>
                      </div>
                      <div className="detail-item">
                        <Sunset className="w-5 h-5 mr-2 text-orange-600"/>
                        <span className="detail-label">Sunset:</span>
                        <span className="detail-value">{weather.sunset}</span>
                      </div>
                    </div>
                  </div>

                  {/* 5-Day Forecast */}
                   {forecast && forecast.daily.length > 0 && (
                      <div className="section-container w-full max-w-4xl mb-6">
                        <h2 className="section-title mb-4">5-Day Forecast</h2>
                        <div className="forecast-grid">
                          {forecast.daily.map((dailyItem, index) => (
                            <DailyForecastCard key={index} forecast={dailyItem} tempUnit={componentTempUnit} />
                          ))}
                        </div>
                      </div>
                   )}
                </>
              )}

              {!loading && !weather && !error && (
                <div className="section-container text-center mt-10 w-full max-w-4xl">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to the Weather Dashboard!</h2>
                  <p className="text-muted-foreground">Enter a city or use your location.</p>
                </div>
              )}
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
