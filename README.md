# ChatGPT Application Examples

A curated collection of ChatGPT applications built with the OpenAI Apps SDK and Model Context Protocol (MCP). This repository showcases practical examples and evolving best practices for building interactive ChatGPT apps.

## Overview

This repository contains:
- **Multiple ChatGPT app examples** demonstrating different use cases and patterns
- **Best Practices documentation** based on real-world development experience
- **Reusable templates and patterns** for building your own ChatGPT apps

## What are ChatGPT Apps?

ChatGPT apps combine the power of conversational AI with custom interactive widgets, allowing you to create rich, dynamic experiences directly within ChatGPT conversations. They use:

- **OpenAI Apps SDK** for building UI widgets
- **Model Context Protocol (MCP)** for server-side logic and data handling
- **React + Vite** for modern, performant user interfaces

## Repository Structure

Each application in this repository follows a consistent structure:

```
app-name/
├── src/
│   └── app-name/          # React UI components
│       └── index.jsx
├── app-name_server_python/ # MCP server implementation
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
└── assets/                 # Build output (generated)
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- pnpm (recommended) or npm
- ChatGPT account with Apps access

### Quick Start

1. **Clone this repository:**
   ```bash
   git clone https://github.com/Arnasltlt/chatgpt-application-examples.git
   cd chatgpt-application-examples
   ```

2. **Choose an example app and follow its README** for specific setup instructions

3. **Read the Best Practices guide** to understand key patterns and avoid common pitfalls

## Best Practices

This repository includes a comprehensive [Best Practices](./Best%20Practices.md) document covering:

- Project structure and naming conventions
- MCP server implementation patterns
- Widget UI development
- Asset delivery strategies
- CORS and security considerations
- Testing and debugging techniques
- Common troubleshooting scenarios

## Contributing

Contributions are welcome! Whether you want to:
- Add a new example application
- Update the Best Practices document
- Fix bugs or improve documentation
- Share new patterns and techniques

Please feel free to open an issue or submit a pull request.

## Applications

- [Your AI Council](./your-ai-council/README.md) — Friendly hello-world ChatGPT app scaffolding the repository.

## Resources

### Official Documentation
- [OpenAI Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- [App Developer Guidelines](https://developers.openai.com/apps-sdk/app-developer-guidelines)
- [Design Guidelines](https://developers.openai.com/apps-sdk/concepts/design-guidelines)
- [Model Context Protocol Spec](https://spec.modelcontextprotocol.io/)

### Tools
- [FastMCP](https://github.com/jlowin/fastmcp) - Python MCP server framework
- [Vite](https://vitejs.dev/) - Frontend build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Support

If you encounter issues or have questions:
1. Check the [Best Practices](./Best%20Practices.md) troubleshooting section
2. Review the [OpenAI documentation](https://developers.openai.com/apps-sdk)
3. Open an issue in this repository

---

**Happy building!** 🚀

