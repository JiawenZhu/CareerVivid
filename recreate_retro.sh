#!/bin/bash
API_KEY="${CAREERVIVID_API_KEY:-YOUR_API_KEY_HERE}"
API_URL="https://us-west1-jastalk-firebase.cloudfunctions.net"

echo "Initializing new Portfolio..."
INIT_RES=$(curl -s -X POST "$API_URL/initPortfolio" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Alex Chen Portfolio (Retro Windows)", "templateId": "dev_terminal"}')

PORTFOLIO_ID=$(echo $INIT_RES | jq -r '.portfolioId')
echo "Created new portfolio with ID: $PORTFOLIO_ID"

echo "Updating Projects..."
curl -s -X PATCH "$API_URL/updatePortfolioProjects" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "'"$PORTFOLIO_ID"'",
    "techStack": ["React", "TypeScript", "Node.js", "Firebase", "Win95 CSS"],
    "projects": [
      {
        "id": "project-1",
        "title": "CodeCraft IDE",
        "description": "A web-based retro terminal IDE built with React and WebContainers.",
        "demoUrl": "https://codecraft.example.com",
        "repoUrl": "https://github.com/alexc/codecraft",
        "tags": ["React", "WebContainers", "TypeScript"]
      },
      {
        "id": "project-2",
        "title": "Nostalgia API",
        "description": "A scalable REST API that serves daily retro gaming trivia.",
        "demoUrl": "https://nostalgia.example.com",
        "tags": ["Node.js", "Express", "MongoDB"]
      }
    ]
  }'

echo "Updating Hero and Theme (Retro Windows 95)..."
curl -s -X PATCH "$API_URL/updatePortfolioHero" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "'"$PORTFOLIO_ID"'",
    "hero": {
      "headline": "Alex Chen",
      "subheadline": "Senior Software Engineer. I build robust web applications with a touch of nostalgia.",
      "ctaPrimaryLabel": "View My Resume.exe",
      "ctaPrimaryUrl": "/resume",
      "buttons": [
         { "id": "btn1", "label": "Email.exe", "variant": "primary", "url": "mailto:alex@example.com" }
      ]
    },
    "theme": {
      "primaryColor": "#008080",
      "secondaryColor": "#c0c0c0",
      "backgroundColor": "#008080",
      "textColor": "#000000",
      "darkMode": false,
      "customCss": "body { font-family: \"MS Sans Serif\", Tahoma, sans-serif !important; } .card, .btn { border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #000; border-bottom: 2px solid #000; background-color: #c0c0c0; }",
      "retroVibe": "windows95"
    },
    "seoMetadata": {
      "title": "Alex Chen - Win95 Portfolio",
      "description": "Welcome to my Retro Windows 95 Desktop Portfolio.",
      "keywords": ["React", "TypeScript", "Windows 95", "Retro", "Portfolio"]
    }
  }'

echo "Done! Public URL: https://careervivid.app/portfolio/$PORTFOLIO_ID"
