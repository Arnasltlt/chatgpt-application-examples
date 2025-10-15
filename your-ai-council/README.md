# Your AI Council - ChatGPT App

A ChatGPT application that provides wisdom from three AI council members with different expertise areas. Each council member offers a unique perspective on user questions.

## Features

- **Three Expert Perspectives**: Strategic Advisor, Technical Expert, and User Experience Specialist
- **Interactive Widget**: Beautiful card-based UI that displays council responses
- **Real-time Data**: Uses `useWidgetProps()` hook to receive data from the MCP server
- **Responsive Design**: Works seamlessly across different screen sizes
- **Loading States**: Proper loading indicators while consulting the council

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS for consistent, accessible design
- **Data Hook**: Custom `useWidgetProps()` hook for ChatGPT integration

### Backend (Python + FastAPI)
- **Framework**: FastAPI for HTTP server
- **Protocol**: MCP (Model Context Protocol) for ChatGPT integration
- **Data Validation**: Pydantic models for input/output validation
- **CORS**: Configured for ChatGPT sandbox compatibility

## File Structure

```
your-ai-council/
├── src/
│   ├── use-widget-props.ts       # Hook for receiving data from ChatGPT
│   └── your-ai-council/
│       ├── index.tsx             # Main React component
│       ├── index.html            # HTML entry point
│       ├── index.css             # Tailwind CSS styles
│       └── widget.ts             # Widget metadata
├── your-ai-council_server_python/
│   ├── main.py                   # MCP server implementation
│   └── requirements.txt          # Python dependencies
├── package.json                  # Node.js dependencies and scripts
├── vite.config.mts              # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip
- ngrok for local development tunneling

### Setup

1. **Install dependencies**:
   ```bash
   cd your-ai-council
   npm install
   ```

2. **Install Python dependencies**:
   ```bash
   cd your-ai-council_server_python
   pip install -r requirements.txt
   ```

3. **Build the widget**:
   ```bash
   npm run build
   ```

4. **Start the MCP server**:
   ```bash
   cd your-ai-council_server_python
   python main.py
   ```

5. **Set up ngrok tunnel**:
   ```bash
   ngrok http 8001
   ```

6. **Configure ChatGPT**:
   - Open ChatGPT → Settings → Personalization → Apps
   - Add new app with MCP URL: `https://YOUR_NGROK_URL.ngrok-free.app/mcp`

## Usage

Once configured in ChatGPT, users can ask questions like:
- "Should I invest in renewable energy stocks?"
- "How should I approach this project technically?"
- "What's the best user experience strategy?"

The app will respond with three council member perspectives, each offering unique insights based on their expertise area.

## Council Members

- **Dr. Sarah Chen** (Strategic Advisor): Focuses on long-term strategic implications
- **Marcus Rodriguez** (Technical Expert): Evaluates technical feasibility and challenges
- **Alex Thompson** (User Experience Specialist): Considers user perspective and needs

## Best Practices Implemented

- ✅ **Proper MCP Protocol**: Full JSON-RPC implementation for ChatGPT integration
- ✅ **Structured Content**: Both text and structured data for UI rendering
- ✅ **Loading States**: User-friendly loading indicators
- ✅ **Error Handling**: Graceful error responses
- ✅ **TypeScript**: Full type safety throughout the application
- ✅ **Accessibility**: Semantic HTML and proper ARIA attributes
- ✅ **Design Guidelines**: Follows ChatGPT design patterns and color schemes
- ✅ **Responsive Design**: Works across different viewport sizes

## Deployment

For production deployment, consider:
- Using a stable tunnel service (ngrok paid plan, Cloudflare Tunnel)
- Hosting on a cloud platform (Vercel, Netlify, Railway)
- Setting up proper CORS for production domains
- Implementing authentication if needed

## Troubleshooting

- **Widget not loading**: Check that assets are built and ngrok tunnel is active
- **CORS errors**: Ensure CORS middleware is properly configured
- **MCP connection issues**: Verify the ngrok URL is accessible and the server is running
- **Build errors**: Check Node.js and Python versions compatibility

## Contributing

1. Make changes to the React component or server logic
2. Test locally with `npm run dev` and the MCP server
3. Build with `npm run build` before committing
4. Update this README if adding new features

## License

See the main project LICENSE file.
