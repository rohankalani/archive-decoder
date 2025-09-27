import React from 'react';
import { Layout } from '@/components/Layout';
import { DatabaseChatInterface } from '@/components/chat/DatabaseChatInterface';

export default function DatabaseChat() {
  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">AI Database Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Chat with AI to query and analyze your air quality monitoring data. 
            Ask questions in natural language and get insights from your database.
          </p>
        </div>
        
        <DatabaseChatInterface className="w-full" />
      </div>
    </Layout>
  );
}