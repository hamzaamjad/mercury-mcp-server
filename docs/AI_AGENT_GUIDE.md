# Mercury MCP Server - AI Agent Guide

## Understanding Mercury for AI Agents

This guide helps AI models (Claude, GPT-4, etc.) understand when and how to use Mercury's unique diffusion-LLM capabilities effectively.

### What Makes Mercury Special?

Mercury is a **diffusion-based language model** that generates text differently from traditional autoregressive models:

- **🚀 Speed**: Up to 10x faster than traditional models for code generation
- **🎯 Parallel Processing**: Generates multiple tokens simultaneously 
- **🔄 Iterative Refinement**: Improves output quality through diffusion steps
- **💡 Fill-in-the-Middle**: Exceptional at code insertion between existing contexts

### When to Choose Mercury

#### ✅ BEST Use Cases for Mercury:

1. **Code Generation & Completion**
   - Writing functions, classes, or modules
   - Implementing algorithms
   - Creating boilerplate code
   - API endpoint implementations

2. **Code Editing (Fill-in-the-Middle)**
   - Completing partially written functions
   - Adding logic between existing code blocks
   - Implementing missing method bodies
   - Inserting error handling

3. **Fast Prototyping**
   - Quick code drafts
   - Rapid iteration on implementations
   - Time-sensitive coding tasks

4. **Technical Documentation**
   - Code comments and docstrings
   - API documentation
   - README files for code projects

#### ⚠️ Consider Alternatives When:

- Needing general knowledge or reasoning
- Writing long-form creative content
- Requiring real-time data or web search
- Complex multi-step reasoning tasks

### Tool Selection Guide

#### `mercury_chat_completion`
**When to use**: 
- General code generation tasks
- Technical conversations
- Code explanation or debugging

**Optimal parameters**:
```json
{
  "temperature": 0.2-0.5,      // Lower for deterministic code
  "diffusion_steps": 30-40,    // Higher for better quality
  "max_tokens": 500-2000       // Mercury handles longer outputs well
}
```

#### `mercury_fim_completion`
**When to use**: 
- Completing code between existing parts
- Implementing function bodies
- Adding missing logic in code

**Why it's special**: Mercury's diffusion architecture excels at understanding bidirectional context, making it superior for insertions.

**Example scenario**:
```python
# User has:
def process_data(items):
    validated = []
    # <- CURSOR HERE
    return analyze_results(validated)

# Mercury FIM is perfect for filling this gap
```

#### `mercury_chat_stream`
**When to use**: 
- Long code generation tasks
- Interactive coding sessions
- When user needs to see progress

**Note**: Streaming maintains Mercury's speed advantage while providing better UX.

### Understanding Diffusion Parameters

#### `diffusion_steps` (Mercury-specific)
- **What it does**: Controls the iterative refinement process
- **Trade-off**: Quality vs Speed
- **Guidelines**:
  - 15-20 steps: Fast drafts, simple code
  - 25-35 steps: Balanced quality/speed (default)
  - 40-50 steps: Maximum quality for complex code

#### `temperature` with Diffusion
- Works differently than in autoregressive models
- Lower values (0.1-0.3) are often better for code
- Affects the noise in the diffusion process

### Best Practices for AI Agents

1. **Communicate Mercury's Strengths**
   - Tell users when Mercury would be faster
   - Suggest FIM for code insertions
   - Highlight speed advantages for iterative development

2. **Parameter Recommendations**
   ```
   For production code: temperature=0.2, diffusion_steps=35
   For exploration: temperature=0.5, diffusion_steps=25
   For quick drafts: temperature=0.3, diffusion_steps=20
   ```

3. **Set User Expectations**
   - Mercury excels at code but may be less suitable for general chat
   - FIM completions might need minor adjustments
   - Higher diffusion steps = better quality but slower

4. **Error Handling**
   - Low confidence scores suggest increasing diffusion_steps
   - FIM boundary errors mean better context is needed
   - Convergence errors indicate the prompt might be too complex

### Example Interactions

#### Good Mercury Usage:
```
User: "Write a Python function to merge two sorted arrays"
AI: "I'll use Mercury to quickly generate an efficient implementation..."
[Uses mercury_chat_completion with temperature=0.3, diffusion_steps=30]
```

#### Better with FIM:
```
User: "Complete this function: def binary_search(arr, target): 
       left, right = 0, len(arr) - 1
       # need the search logic here
       return -1"
AI: "Mercury's FIM capability is perfect for inserting the search logic..."
[Uses mercury_fim_completion]
```

#### When to Suggest Alternatives:
```
User: "Explain quantum computing principles"
AI: "For conceptual explanations, I'll use my built-in knowledge rather than Mercury, 
     which is optimized for code generation..."
```

### Integration Tips

1. **Describe Mercury's Nature**
   - "Mercury uses diffusion technology for faster code generation"
   - "This model excels at understanding code context bidirectionally"

2. **Guide Parameter Selection**
   - Ask about speed vs quality preferences
   - Suggest appropriate diffusion_steps based on task complexity

3. **Highlight Unique Features**
   - Mention FIM for code insertions
   - Emphasize speed for iterative development
   - Note parallel token generation advantages

4. **Manage Expectations**
   - Be transparent about Mercury's code-focused nature
   - Explain that it's not a general-purpose assistant
   - Set realistic quality expectations based on parameters

By understanding these characteristics, AI agents can make intelligent decisions about when to use Mercury and how to configure it optimally for each use case.