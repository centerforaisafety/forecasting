"use server";

import {
  createForecastSchema,
  CreateForecastSchema,
} from "@/lib/validation/forecast";
import prisma from "@/lib/db/prisma";
import { Source } from "../types";
import {
  Forecast as ForecastModel,
  sources as SourceModel,
} from "@prisma/client";

export async function checkAdminStatus(userEmails: string[]): Promise<boolean> {
  const adminUser = await prisma.adminUser.findFirst({
    where: {
      email: {
        in: userEmails,
      },
    },
  });
  return adminUser !== null;
}

export async function createForecast(
  input: CreateForecastSchema,
  sources: Source[]
): Promise<ForecastModel> {
  try {
    const parseResult = createForecastSchema.safeParse(input);
    if (!parseResult.success) {
      console.error(parseResult.error);
      throw new Error("Invalid input for Forecast");
    }
    const data = parseResult.data;
    const now = new Date();
    
    const [forecast] = await Promise.all([
      _createForecastRecord(data, now),
    ]);

    return forecast;
  } catch (error) {
    console.error("Unexpected error in createForecast:", error);
    throw new Error("Failed to process forecast creation");
  }
}

export async function fetchForecast(id: string): Promise<ForecastModel | null> {
  try {
    const forecast = await prisma.forecast.findUnique({
      where: { id },
    });

    if (!forecast) {
      console.log(`No forecast found with id: ${id}`);
      return null;
    }

    return forecast;
  } catch (error) {
    console.error(`Error fetching forecast with id ${id}:`, error);
    throw new Error("Failed to fetch forecast");
  }
}

export async function fetchSources(links: string[]): Promise<SourceModel[]> {
  try {
    const sources = await prisma.sources.findMany({
      where: {
        id: { in: links },
      },
    });

    return sources;
  } catch (error) {
    console.error("Error fetching sources:", error);
    throw new Error("Failed to fetch sources");
  }
}

async function _createForecastRecord(data: CreateForecastSchema, now: Date) {
  try {
    return await prisma.forecast.create({
      data: {
        ...data,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (forecastError) {
    console.error("Error creating forecast:", forecastError);
    throw new Error("Failed to create forecast");
  }
}
