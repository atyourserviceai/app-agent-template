import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for getting current weather information for a location
 * Note: This is a placeholder implementation. In a real application,
 * this would connect to a weather API service.
 */
export const getWeatherInformation = tool({
  description: "Fetch current weather for a location",
  parameters: z.object({
    location: z
      .string()
      .describe("The location to get weather for (city name or coordinates)"),
  }),
  execute: async ({ location }: { location: string }) => {
    // In a real implementation, this would call a weather API
    // For now, return a mock response
    return {
      location,
      temperature: {
        celsius: 22,
        fahrenheit: 72,
      },
      conditions: "Partly cloudy",
      humidity: "45%",
      windSpeed: "10 km/h",
      forecast: "Similar conditions expected for the next 24 hours",
    };
  },
});

/**
 * Tool for getting the current local time in a location
 * Note: This is a placeholder implementation. In a real application,
 * this would connect to a time zone API service.
 */
export const getLocalTime = tool({
  description: "Fetch current local time for a location",
  parameters: z.object({
    location: z
      .string()
      .describe(
        "The location to get local time for (city, country, or time zone)"
      ),
  }),
  execute: async ({ location }: { location: string }) => {
    // In a real implementation, this would call a time zone API
    // For now, return the current time with a mock offset
    const now = new Date();

    // Return formatted time
    return {
      location,
      localTime: now.toLocaleTimeString(),
      localDate: now.toLocaleDateString(),
      timeZone: "UTC (mock data)",
      utcOffset: "+00:00 (mock data)",
    };
  },
});
