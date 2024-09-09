"use server";

import prisma from "@/lib/db/prisma";
import type {BenchmarkQuestion} from "../types";
import { Prisma } from '@prisma/client';


export async function fetch_benchmarks(benchmarkType: string) {
  try {
    const questions = await prisma.benchmarks.findMany({
      where: { benchmarkType },
      orderBy: { createdAt: 'desc' },
    });
    return questions;
  } catch (error) {
    console.error("Error fetching benchmark questions:", error);
    throw new Error("Failed to fetch benchmark questions");
  }
}

export async function add_question_to_benchmark(input: Partial<Omit<Prisma.benchmarksCreateInput, 'id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const newQuestion = await prisma.benchmarks.create({
      data: {
        benchmarkType: input.benchmarkType ?? undefined,
        question: input.question!, // This field is required
        backgroundText: input.backgroundText ?? undefined,
        category: input.category ?? undefined,
        beforeTimestamp: input.beforeTimestamp ?? undefined,
        resolution: input.resolution ?? undefined,
        predictions: input.predictions ?? undefined,
      },
    });
    return newQuestion;
  } catch (error) {
    console.error("Error adding benchmark question:", error);
    throw new Error("Failed to add benchmark question");
  }
}

export async function update_question_to_benchmark(id: string, input: Partial<Omit<BenchmarkQuestion, 'id'>>) {
  try {
    const updatedQuestion = await prisma.benchmarks.update({
      where: { id },
      data: input,
    });
    return updatedQuestion;
  } catch (error) {
    console.error("Error updating benchmark question:", error);
    throw new Error("Failed to update benchmark question");
  }
}
export async function delete_question_in_benchmark(id: string) {
  try {
    await prisma.benchmarks.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting benchmark question:", error);
    throw new Error("Failed to delete benchmark question");
  }
}