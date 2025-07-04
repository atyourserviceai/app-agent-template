import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for getting current weather information for a location
 * Note: This is a placeholder implementation. In a real application,
 * this would connect to a weather API service.
 */
export const getWeatherInformation = tool({
  description: "Fetch current weather for a location",
  execute: async ({ location }: { location: string }) => {
    // In a real implementation, this would call a weather API
    // For now, return a mock response
    return {
      conditions: "Partly cloudy",
      forecast: "Similar conditions expected for the next 24 hours",
      humidity: "45%",
      location,
      temperature: {
        celsius: 22,
        fahrenheit: 72,
      },
      windSpeed: "10 km/h",
    };
  },
  parameters: z.object({
    location: z
      .string()
      .describe("The location to get weather for (city name or coordinates)"),
  }),
});

/**
 * Tool for getting the current local time in a location
 * Note: This is a placeholder implementation. In a real application,
 * this would connect to a time zone API service.
 */
export const getLocalTime = tool({
  description: "Fetch current local time for a location",
  execute: async ({ location }: { location: string }) => {
    // In a real implementation, this would call a time zone API
    // For now, return the current time with a mock offset
    const now = new Date();

    // Return formatted time
    return {
      localDate: now.toLocaleDateString(),
      localTime: now.toLocaleTimeString(),
      location,
      timeZone: "UTC (mock data)",
      utcOffset: "+00:00 (mock data)",
    };
  },
  parameters: z.object({
    location: z
      .string()
      .describe(
        "The location to get local time for (city, country, or time zone)"
      ),
  }),
});
