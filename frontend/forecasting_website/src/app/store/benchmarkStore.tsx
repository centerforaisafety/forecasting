import { create } from 'zustand';
import { fetch_benchmarks, add_question_to_benchmark, update_question_to_benchmark, delete_question_in_benchmark } from '../server_actions/benchmark-actions';
import { BenchmarkQuestion } from '../types';

export interface Result {
  question: string;
  prediction: number | null;
  response: string;
  sources: any[];
}

interface BenchmarkState {
  questions: { [key: string]: BenchmarkQuestion[] };
  results: { [key: string]: { [key: string]: Result } };
  isLoading: { [key: string]: { [key: string]: boolean } };
  expandedRows: { [key: string]: { [key: string]: boolean } };
  fetchBenchmarks: (type: string) => Promise<void>;
  addQuestion: (type: string, question: Omit<BenchmarkQuestion, 'id'>) => Promise<void>;
  updateQuestion: (type: string, id: string, question: Partial<BenchmarkQuestion>) => Promise<void>;
  deleteQuestion: (type: string, id: string) => Promise<void>;
  setResult: (type: string, id: string, result: Result) => void;
  setLoading: (type: string, id: string, isLoading: boolean) => void;
  toggleRowExpansion: (type: string, id: string) => void;
}

export const useBenchmarkStore = create<BenchmarkState>((set, get) => ({
  questions: {},
  results: {},
  isLoading: {},
  expandedRows: {},

  fetchBenchmarks: async (type: string) => {
    try {
      const questions = await fetch_benchmarks(type);
      set((state) => ({
        questions: { ...state.questions, [type]: questions },
        isLoading: { ...state.isLoading, [type]: {} },
        expandedRows: { ...state.expandedRows, [type]: {} },
      }));
    } catch (error) {
      console.error(`Error fetching ${type} benchmarks:`, error);
    }
  },

  addQuestion: async (type: string, question: Partial<Omit<BenchmarkQuestion, 'id'>>) => {
    try {
      
      const newQuestion = await add_question_to_benchmark({ ...question, benchmarkType: type });
      set((state) => ({
        questions: {
          ...state.questions,
          [type]: [...(state.questions[type] || []), newQuestion],
        },
      }));
    } catch (error) {
      console.error(`Error adding question to ${type} benchmark:`, error);
    }
  },

  updateQuestion: async (type: string, id: string, questionUpdate: Partial<BenchmarkQuestion>) => {
    try {
      const { id: _, ...updateData } = questionUpdate;

      const updatedQuestion = await update_question_to_benchmark(id, updateData);
      set((state) => ({
        questions: {
          ...state.questions,
          [type]: state.questions[type].map((q) => (q.id === id ? { ...q, ...updatedQuestion } : q)),
        },
      }));
    } catch (error) {
      console.error(`Error updating question in ${type} benchmark:`, error);
    }
  },

  deleteQuestion: async (type: string, id: string) => {
    try {
      await delete_question_in_benchmark(id);
      set((state) => ({
        questions: {
          ...state.questions,
          [type]: state.questions[type].filter((q) => q.id !== id),
        },
      }));
    } catch (error) {
      console.error(`Error deleting question from ${type} benchmark:`, error);
    }
  },

  setResult: (type: string, id: string, result: Result) => {
    set((state) => ({
      results: {
        ...state.results,
        [type]: { ...(state.results[type] || {}), [id]: result },
      },
    }));
  },

  setLoading: (type: string, id: string, isLoading: boolean) => {
    set((state) => ({
      isLoading: {
        ...state.isLoading,
        [type]: { ...(state.isLoading[type] || {}), [id]: isLoading },
      },
    }));
  },

  toggleRowExpansion: (type: string, id: string) => {
    set((state) => ({
      expandedRows: {
        ...state.expandedRows,
        [type]: { ...(state.expandedRows[type] || {}), [id]: !state.expandedRows[type]?.[id] },
      },
    }));
  },
}));