import React from 'react';
import { AgentChat } from '../components/AgentChat';
import { Tool } from '../agent/Tool';
import { Type } from '@google/genai';

const getCurrentTimeTool: Tool = {
  name: "get_current_time",
  description: "Get the current time in the user's local timezone.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  },
  execute: async () => {
    return new Date().toLocaleTimeString();
  }
};

const changeBackgroundColorTool: Tool = {
  name: "change_background_color",
  description: "Change the background color of the web page. Use hex codes or standard CSS color names.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      color: {
        type: Type.STRING,
        description: "The CSS color value."
      }
    },
    required: ["color"]
  },
  execute: async (args: { color: string }) => {
    document.body.style.backgroundColor = args.color;
    return `Background color changed to ${args.color}`;
  }
};

export const AgentPage: React.FC = () => {
  // In a real app, you would fetch this from your secure backend or user settings.
  // For demonstration, we allow setting it from local storage or environment
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';

  return (
    <div className="container mx-auto p-6 max-w-4xl h-[calc(100vh-100px)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Web Agent</h1>
        <p className="text-gray-600">
          This autonomous agent runs entirely in your browser using the universal 
          <code>QueryEngine</code> abstraction. It has access to tools that can manipulate 
          the DOM or query local state.
        </p>
      </div>

      {!apiKey ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              ⚠️
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need a Gemini API Key to use the agent. Set `localStorage.setItem('gemini_api_key', 'YOUR_KEY')` in your console and refresh.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[500px]">
          <AgentChat 
            apiKey={apiKey} 
            tools={[getCurrentTimeTool, changeBackgroundColorTool]} 
            systemInstruction="You are a helpful web assistant. You can change the background color of the page and tell the time."
          />
        </div>
      )}
    </div>
  );
};

export default AgentPage;
