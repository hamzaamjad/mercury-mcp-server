# Mercury MCP Server API Reference

## Overview

The Mercury MCP Server exposes Mercury's diffusion-LLM capabilities through standardized MCP tools. All tools follow the MCP protocol and return structured JSON responses.

## Available Tools

### mercury_chat_completion

Generate chat completions using Mercury's diffusion-LLM.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| messages | Array<Message> | Yes | - | Conversation messages |
| model | string | No | mercury-coder-small | Model to use |
| temperature | number | No | 0.7 | Sampling temperature (0-2) |
| max_tokens | number | No | - | Maximum tokens to generate |
| top_p | number | No | 1.0 | Nucleus sampling parameter |
| frequency_penalty | number | No | 0 | Frequency penalty (-2 to 2) |
| presence_penalty | number | No | 0 | Presence penalty (-2 to 2) |
| diffusion_steps | number | No | 20 | Number of diffusion steps |
| noise_schedule | string | No | linear | Noise schedule (linear, cosine, exponential) |

#### Message Format

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}
```

#### Example Request

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful coding assistant"
    },
    {
      "role": "user",
      "content": "Write a Python function to calculate fibonacci numbers"
    }
  ],
  "temperature": 0.5,
  "max_tokens": 200,
  "diffusion_steps": 30
}
```

#### Example Response

```json
{
  "content": [{
    "type": "text",
    "text": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)"
  }],
  "metadata": {
    "model": "mercury-coder-small",
    "usage": {
      "prompt_tokens": 25,
      "completion_tokens": 45,
      "total_tokens": 70
    },
    "finishReason": "stop",
    "performance": {
      "latencyMs": 823,
      "tokensPerSecond": 54.6
    },
    "diffusion": {
      "steps_completed": 30,
      "noise_reduction_ratio": 0.95,
      "confidence_score": 0.92
    }
  }
}
```

### mercury_chat_stream

Stream chat completions for real-time responses.

#### Parameters

Same as `mercury_chat_completion`

#### Differences from Non-Streaming

- Returns chunks progressively
- Better user experience for long outputs
- Includes streaming metadata

### mercury_fim_completion

Generate code completions using Fill-in-the-Middle.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| prompt | string | Yes | - | Code before the cursor |
| suffix | string | Yes | - | Code after the cursor |
| model | string | No | mercury-coder-small | Model to use |
| max_tokens | number | No | 256 | Maximum tokens |
| temperature | number | No | 0.2 | Sampling temperature |
| max_middle_tokens | number | No | - | Specific limit for middle section |
| diffusion_steps | number | No | 20 | Diffusion steps |
| alternative_completions | number | No | 1 | Number of alternatives (1-5) |

#### Example Request

```json
{
  "prompt": "def calculate_average(numbers):\n    total = ",
  "suffix": "\n    return total / len(numbers)",
  "max_middle_tokens": 50,
  "alternative_completions": 3
}
```

#### Example Response

```json
{
  "content": [{
    "type": "text",
    "text": "sum(numbers)"
  }],
  "metadata": {
    "confidence": 0.94,
    "alternatives": [
      {
        "text": "sum(numbers)",
        "confidence": 0.94
      },
      {
        "text": "0\n    for num in numbers:\n        total += num",
        "confidence": 0.87
      },
      {
        "text": "reduce(lambda a, b: a + b, numbers, 0)",
        "confidence": 0.76
      }
    ],
    "fim": {
      "alternatives_generated": 3,
      "best_confidence_score": 0.94,
      "diffusion_steps_used": 20
    }
  }
}
```

### mercury_list_models

List all available Mercury models with their capabilities.

#### Parameters

None

#### Example Response

```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"models\": [
        {
          \"id\": \"mercury-coder-small\",
          \"name\": \"mercury-coder-small\",
          \"owned_by\": \"inception-labs\",
          \"created\": \"2024-01-15T00:00:00.000Z\",
          \"capabilities\": [\"chat\", \"fim\", \"streaming\"],
          \"specifications\": {
            \"context_window\": 32768,
            \"supports_fim\": true,
            \"supports_streaming\": true,
            \"supports_tools\": true,
            \"diffusion_based\": true,
            \"recommended_use_cases\": [
              \"Code generation and completion\",
              \"Fill-in-the-middle code editing\",
              \"Technical documentation\",
              \"API development\",
              \"Bug fixing and refactoring\"
            ]
          }
        }
      ],
      \"default_model\": \"mercury-coder-small\",
      \"total_models\": 1
    }"
  }]
}
```

## Error Responses

All errors follow a consistent format:

```json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "{
      \"error\": {
        \"type\": \"error_type\",
        \"message\": \"Human-readable error message\",
        \"code\": \"ERROR_CODE\",
        \"retryable\": true,
        \"retryAfter\": 60,
        \"suggestedFix\": \"Try this to resolve the issue\"
      }
    }"
  }]
}
```

### Error Types

| Type | Description | Retryable |
|------|-------------|-----------|
| validation_error | Invalid input parameters | No |
| authentication_error | Invalid or missing API key | No |
| rate_limit_error | API rate limit exceeded | Yes |
| diffusion_convergence_error | Model failed to converge | Yes |
| fim_boundary_error | Invalid FIM context | No |
| server_error | Mercury API error | Sometimes |

## Best Practices

### Optimal Parameters

1. **For Code Generation**:
   - Temperature: 0.2-0.5
   - Diffusion steps: 30-40
   - Use FIM for insertions

2. **For Creative Tasks**:
   - Temperature: 0.7-1.0
   - More diffusion steps for quality

3. **For Fast Drafts**:
   - Lower diffusion steps (15-20)
   - Accept lower confidence scores

### Performance Tips

1. **Use Caching**: Deterministic requests (temperature=0) are cached
2. **Stream Long Outputs**: Better UX for lengthy generations
3. **Request Alternatives**: FIM supports multiple completions

### Rate Limiting

- Default: 100 requests per minute
- Respect `retryAfter` in error responses
- Use exponential backoff for retries