"use client";

import React, { useState, useEffect } from 'react';
import Chat from "./chat/page";
import { useUser } from "@clerk/nextjs";
import { useForecastStore } from "./store/forecastStore";
import Sidebar from './sidebar';
import Discover from './discover/page';
import LeaderboardPage from './leaderboard/page';
import BenchmarkPage from './benchmark/page';

export default function Home() {
  const { isSignedIn, user } = useUser();
  const { setAuthentication } = useForecastStore();
  const [activeTab, setActiveTab] = useState<string>('ask');

  useEffect(() => {
    if (isSignedIn && user) {
      const userInfo = {
        name: user.fullName,
        emails: user.emailAddresses.map(email => email.emailAddress)
      };
      setAuthentication(true, userInfo);
    } else {
      setAuthentication(false);
    }
  }, [isSignedIn, user, setAuthentication]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-hidden pb-16 md:pb-0">
        <div className="h-full w-full overflow-auto">
          {activeTab === 'ask' && <Chat />}
          {activeTab === 'discover' && <Discover/>}
          {/* {activeTab === 'leaderboard' && <LeaderboardPage/>} */}
          {/* {activeTab === 'benchmark' && <BenchmarkPage/>} */}
        </div>
      </main>
    </div>
  );
}