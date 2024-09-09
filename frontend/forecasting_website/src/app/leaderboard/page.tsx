import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  model: string;
  elo: number;
  accuracy: number;
  brierScore: number;
  votes: number;
  organization: string;
  license: string;
  knowledgeCutoff: string;
}

const leaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    model: "grok-2",
    elo: 1600,
    accuracy: 0.85,
    brierScore: 0.08,
    votes: 15000,
    organization: "xAI",
    license: "Proprietary",
    knowledgeCutoff: "2024-03"
  },
  {
    rank: 2,
    model: "gpt-4o-2024-05-13",
    elo: 1590,
    accuracy: 0.84,
    brierScore: 0.09,
    votes: 14500,
    organization: "OpenAI",
    license: "Proprietary",
    knowledgeCutoff: "2024-05"
  },
  {
    rank: 3,
    model: "claude-3.5-sonnet",
    elo: 1580,
    accuracy: 0.83,
    brierScore: 0.10,
    votes: 14000,
    organization: "Anthropic",
    license: "Proprietary",
    knowledgeCutoff: "2024-04"
  },
  {
    rank: 4,
    model: "gemini-1.5-pro",
    elo: 1570,
    accuracy: 0.82,
    brierScore: 0.11,
    votes: 13500,
    organization: "Google",
    license: "Proprietary",
    knowledgeCutoff: "2024-02"
  },
  {
    rank: 5,
    model: "llama-3.1-405B",
    elo: 1560,
    accuracy: 0.81,
    brierScore: 0.12,
    votes: 13000,
    organization: "Meta",
    license: "Open Source",
    knowledgeCutoff: "2024-01"
  },
];

// ... rest of the component code remains the same

const LeaderboardPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold"><Trophy/> Model Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Elo</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Brier Score</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Knowledge Cutoff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((entry) => (
                  <TableRow key={entry.rank} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-center">{entry.rank}</TableCell>
                    <TableCell>{entry.model}</TableCell>
                    <TableCell>{entry.elo}</TableCell>
                    <TableCell>{(entry.accuracy * 100).toFixed(2)}%</TableCell>
                    <TableCell>{entry.brierScore.toFixed(4)}</TableCell>
                    <TableCell>{entry.votes.toLocaleString()}</TableCell>
                    <TableCell>{entry.organization}</TableCell>
                    <TableCell>{entry.license}</TableCell>
                    <TableCell>{entry.knowledgeCutoff}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;